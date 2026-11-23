import StatusCodes from 'http-status-codes'
import { HttpError } from '../../../errors/graphql.js'
import { RURALPAYMENTS_API_ERROR_001 } from '../../../logger/codes.js'
import {
  transformBankChangeInputToSubmission,
  transformBusinessDetailsToOrgDetailsCreate,
  transformOrganisationToBusiness,
  transformPermissionGroupsToBusinessCustomerPrivileges
} from '../../../transformers/rural-payments/business.js'
import { retrievePersonIdByCRN } from '../customer/common.js'
import {
  businessAdditionalDetailsUpdateResolver,
  businessAllFieldsUpdateResolver,
  businessDeactivateResolver,
  businessDetailsUpdateResolver,
  businessLockResolver,
  businessReactivateResolver,
  businessUnlockResolver,
  retrieveFrnBySbi,
  retrieveOrgIdBySbi,
  validatePhoneHasNumber
} from './common.js'
import { Query } from './query.js'

const buildCustomerAuthorisationRequest = async ({
  input,
  dataSources,
  auditTrail,
  info,
  action,
  defraIdContext
}) => {
  // role and permissions are optional: omitting both builds a body that unlinks the customer
  // from the business when sent to the update endpoint
  const { sbi, crn, role, permissions = [] } = input
  auditTrail?.recordAccount(info, 'sbi', sbi)
  auditTrail?.recordAccount(info, 'crn', crn)
  auditTrail?.recordEntity(info, {
    entity: 'permission',
    action,
    entityid: `${sbi}-${crn}`
  })
  const [organisationId, personId] = await Promise.all([
    retrieveOrgIdBySbi(sbi, { dataSources, defraIdContext }).then((id) => {
      auditTrail?.recordAccount(info, 'organisationId', id)
      return id
    }),
    retrievePersonIdByCRN(crn, dataSources).then((id) => {
      auditTrail?.recordAccount(info, 'personId', id)
      return id
    })
  ])

  return {
    organisationId,
    personId,
    body: {
      personRoles: role ? [{ role, personId }] : [],
      personPrivileges:
        permissions.length > 0
          ? [
              {
                privilegeNames: transformPermissionGroupsToBusinessCustomerPrivileges(
                  permissions,
                  dataSources.permissions.getPermissionGroups()
                ),
                personId
              }
            ]
          : []
    }
  }
}

const validateBankChangeRequest = async (input, dataSources, { organisationId, frn }) => {
  const { crn } = input
  const { ruralPaymentsBusiness } = dataSources

  const personId = await retrievePersonIdByCRN(crn, dataSources)
  const lockedStatus = await ruralPaymentsBusiness.getBankChangeLockedStatus(
    organisationId,
    `${personId}`
  )
  if (lockedStatus.locked) {
    return {
      failure: {
        __typename: 'BankDetailsLocked',
        message: 'Bank details are locked for changes'
      }
    }
  }

  const accountStatus = await ruralPaymentsBusiness.getBankChangeAccountStatus(organisationId)
  if (!accountStatus.editable) {
    return {
      failure: {
        __typename: 'BankDetailsNotEditable',
        message: 'Bank details are not currently editable',
        submitted: accountStatus.submitted,
        updatedRecently: accountStatus.updatedRecently,
        new: accountStatus.new
      }
    }
  }

  const submission = transformBankChangeInputToSubmission(input, {
    organisationId,
    personId: `${personId}`,
    frn
  })

  const validation = await ruralPaymentsBusiness.validateBankChange(submission)
  if (validation.status === 'FAILED') {
    if (validation.attemptsRemaining === 0) {
      return {
        failure: {
          __typename: 'BankDetailsLocked',
          message: validation.message || 'Bank details failed validation'
        }
      }
    }
    return {
      failure: {
        __typename: 'BankDetailsValidationFailed',
        message: validation.message || 'Bank details failed validation',
        attemptsRemaining: validation.attemptsRemaining
      }
    }
  }

  if (validation.status !== 'MATCH' && validation.status !== 'PARTIAL_MATCH') {
    // the data source logger is the request logger, so this line carries the trace id
    ruralPaymentsBusiness.logger.error('Unexpected bank change validation status', {
      status: validation.status,
      code: RURALPAYMENTS_API_ERROR_001
    })
    throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR)
  }

  return { submission, validation }
}

/**
 * Builds a bank details mutation resolver. The resolver looks up the org id and FRN for the SBI
 * (both cached, so a warm cache makes no Rural Payments call), records the audit trail (even when
 * a lookup fails), and validates the bank change request. A validation failure is returned as is;
 * otherwise handleRequest builds the response.
 * @param {string} auditAction the action recorded against the bank-account audit entity
 * @param {Function} handleRequest called with ({ submission, validation }, dataSources) when the
 *   request passes validation, and returns the mutation result
 * @returns {Function} the GraphQL resolver
 */
const bankDetailsResolver =
  (auditAction, handleRequest) =>
  async (_, { input }, { dataSources, auditTrail, defraIdContext }, info) => {
    auditTrail?.recordAccount(info, 'sbi', input.sbi)
    let organisationId
    let frn
    try {
      // Sequential on purpose: on a cold cache, the FRN lookup resolves the org id again, so
      // running it after the org id has been cached avoids a duplicate upstream search
      organisationId = await retrieveOrgIdBySbi(input.sbi, { dataSources, defraIdContext })
      frn = await retrieveFrnBySbi(input.sbi, { dataSources, defraIdContext })
    } finally {
      if (organisationId) {
        auditTrail?.recordAccount(info, 'organisationId', `${organisationId}`)
      }
      if (frn) {
        auditTrail?.recordAccount(info, 'frn', frn)
      }
      auditTrail?.recordEntity(info, {
        entity: 'bank-account',
        action: auditAction,
        entityid: frn
      })
    }
    const result = await validateBankChangeRequest(input, dataSources, {
      organisationId: `${organisationId}`,
      frn
    })
    return result.failure ?? handleRequest(result, dataSources)
  }

export const Mutation = {
  createBusiness: async (_, { input }, { dataSources, auditTrail }, info) => {
    const { crn, ...businessDetails } = input
    let business
    try {
      validatePhoneHasNumber(businessDetails.phone)
      const personId = await retrievePersonIdByCRN(crn, dataSources)
      const orgDetails = transformBusinessDetailsToOrgDetailsCreate(businessDetails)
      const response = await dataSources.ruralPaymentsBusiness.createOrganisationByPersonId(
        personId,
        orgDetails
      )
      business = transformOrganisationToBusiness(response)
    } finally {
      if (business) {
        auditTrail?.recordAccount(info, 'sbi', business.sbi)
        auditTrail?.recordAccount(info, 'organisationId', business.organisationId)
      }
      auditTrail?.recordEntity(info, {
        entity: 'business',
        action: 'created',
        entityid: business?.sbi
      })
    }
    return { success: true, business }
  },
  createBusinessCustomerBankDetails: bankDetailsResolver(
    'updated',
    async ({ submission }, dataSources) => {
      await dataSources.ruralPaymentsBusiness.submitBankChange(submission)
      return { __typename: 'BankDetailsSubmitted', success: true }
    }
  ),
  validateBusinessCustomerBankDetails: bankDetailsResolver('validate', ({ validation }) => {
    if (validation.status === 'PARTIAL_MATCH') {
      return {
        __typename: 'BankDetailsPartialMatch',
        message: validation.message || 'Bank details partially match'
      }
    }
    return {
      __typename: 'BankDetailsMatched',
      message: validation.message || 'Bank details match'
    }
  }),
  updateBusinessName: businessDetailsUpdateResolver,
  updateBusinessPhone: businessDetailsUpdateResolver,
  updateBusinessEmail: businessDetailsUpdateResolver,
  updateBusinessAddress: businessDetailsUpdateResolver,
  updateBusinessVAT: businessDetailsUpdateResolver,
  updateBusinessLegalStatus: businessAdditionalDetailsUpdateResolver,
  updateBusinessType: businessAdditionalDetailsUpdateResolver,
  updateBusinessDateStartedFarming: businessAdditionalDetailsUpdateResolver,
  updateBusinessRegistrationNumbers: businessAdditionalDetailsUpdateResolver,
  updateBusinessAllFields: businessAllFieldsUpdateResolver,
  updateBusinessLock: businessLockResolver,
  updateBusinessUnlock: businessUnlockResolver,
  updateBusinessReactivate: businessReactivateResolver,
  updateBusinessDeactivate: businessDeactivateResolver,

  addCustomerToBusiness: async (
    _,
    { input },
    { dataSources, auditTrail, defraIdContext },
    info
  ) => {
    const { organisationId, body } = await buildCustomerAuthorisationRequest({
      input,
      dataSources,
      auditTrail,
      defraIdContext,
      info,
      action: 'created'
    })

    return dataSources.ruralPaymentsBusiness.createAuthorisationForOrganisation(
      organisationId,
      body
    )
  },

  updateCustomerPermissionsAndRelationshipToBusiness: async (
    _,
    { input },
    { dataSources, auditTrail, defraIdContext },
    info
  ) => {
    const { organisationId, personId, body } = await buildCustomerAuthorisationRequest({
      input,
      dataSources,
      auditTrail,
      defraIdContext,
      info,
      action: 'updated'
    })

    return dataSources.ruralPaymentsBusiness.updateAuthorisationForPersonOnOrganisation(
      organisationId,
      personId,
      body
    )
  },

  deleteCustomerFromBusiness: async (
    _,
    { input },
    { dataSources, auditTrail, defraIdContext },
    info
  ) => {
    // Rural Payments removes the customer from the business when the update is sent with
    // no roles and no privileges
    const { organisationId, personId, body } = await buildCustomerAuthorisationRequest({
      input: { sbi: input.sbi, crn: input.crn },
      dataSources,
      auditTrail,
      defraIdContext,
      info,
      action: 'deleted'
    })

    return dataSources.ruralPaymentsBusiness.updateAuthorisationForPersonOnOrganisation(
      organisationId,
      personId,
      body
    )
  }
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}

export const UpdateBusinessAllFieldsResponse = UpdateBusinessResponse
