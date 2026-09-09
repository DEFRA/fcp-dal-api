import StatusCodes from 'http-status-codes'
import { HttpError, NotFound } from '../../../errors/graphql.js'
import { RURALPAYMENTS_API_ERROR_001 } from '../../../logger/codes.js'
import { logger } from '../../../logger/logger.js'
import {
  transformBankChangeInputToSubmission,
  transformBusinessDetailsToOrgDetailsCreate,
  transformOrganisationToBusiness
} from '../../../transformers/rural-payments/business.js'
import { retrievePersonIdByCRN } from '../customer/common.js'
import {
  businessAdditionalDetailsUpdateResolver,
  businessAllFieldsUpdateResolver,
  businessDetailsUpdateResolver,
  businessLockResolver,
  businessUnlockResolver
} from './common.js'
import { Query } from './query.js'

const getOrganisation = async (dataSources, sbi) => {
  const { ruralPaymentsBusiness } = dataSources
  const organisation = await ruralPaymentsBusiness.getOrganisationBySBI(sbi)

  if (!organisation.businessReference) {
    throw new NotFound('FRN not found for business')
  }
  return organisation
}

const validateBankChangeRequest = async (input, dataSources, organisation) => {
  const { crn } = input
  const { ruralPaymentsBusiness } = dataSources

  const personId = await retrievePersonIdByCRN(crn, dataSources)
  const organisationId = `${organisation.id}`
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
    frn: organisation.businessReference
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
    logger.error('Unexpected bank change validation status', {
      status: validation.status,
      code: RURALPAYMENTS_API_ERROR_001
    })
    throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR)
  }

  return { submission, validation }
}

export const Mutation = {
  createBusiness: async (_, { input }, { dataSources, auditTrail }, info) => {
    const { crn, ...businessDetails } = input
    let business
    try {
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
  createBusinessCustomerBankDetails: async (_, { input }, { dataSources, auditTrail }, info) => {
    auditTrail?.recordAccount(info, 'sbi', input.sbi)
    let organisation
    try {
      organisation = await getOrganisation(dataSources, input.sbi)
    } finally {
      if (organisation) {
        auditTrail?.recordAccount(info, 'organisationId', `${organisation.id}`)
        auditTrail?.recordAccount(info, 'frn', organisation.businessReference)
      }
      auditTrail?.recordEntity(info, {
        entity: 'bank-account',
        action: 'updated',
        entityid: organisation?.businessReference
      })
    }
    const { failure, submission } = await validateBankChangeRequest(
      input,
      dataSources,
      organisation
    )
    if (failure) {
      return failure
    }

    await dataSources.ruralPaymentsBusiness.submitBankChange(submission)
    return { __typename: 'BankDetailsSubmitted', success: true }
  },
  validateBusinessCustomerBankDetails: async (_, { input }, { dataSources, auditTrail }, info) => {
    auditTrail?.recordAccount(info, 'sbi', input.sbi)
    let organisation
    try {
      organisation = await getOrganisation(dataSources, input.sbi)
    } finally {
      if (organisation) {
        auditTrail?.recordAccount(info, 'organisationId', `${organisation.id}`)
        auditTrail?.recordAccount(info, 'frn', organisation.businessReference)
      }
      auditTrail?.recordEntity(info, {
        entity: 'bank-account',
        action: 'validate',
        entityid: organisation?.businessReference
      })
    }
    const { failure, validation } = await validateBankChangeRequest(
      input,
      dataSources,
      organisation
    )
    if (failure) {
      return failure
    }

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
  },
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
  updateBusinessUnlock: businessUnlockResolver
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}

export const UpdateBusinessAllFieldsResponse = UpdateBusinessResponse
