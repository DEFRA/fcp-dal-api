import { NotFound } from '../../../errors/graphql.js'
import {
  transformBankChangeInputToSubmission,
  transformBusinessDetailsToOrgDetailsCreate,
  transformOrganisationToBusiness
} from '../../../transformers/rural-payments/business.js'
import { retrievePersonIdByCRN } from '../customer/common.js'
import {
  businessAdditionalDetailsUpdateResolver,
  businessDetailsUpdateResolver,
  businessLockResolver,
  businessUnlockResolver
} from './common.js'
import { Query } from './query.js'

export const Mutation = {
  createBusiness: async (_, { input }, { dataSources }) => {
    const { crn, ...businessDetails } = input
    const personId = await retrievePersonIdByCRN(crn, dataSources)
    const orgDetails = transformBusinessDetailsToOrgDetailsCreate(businessDetails)
    const response = await dataSources.ruralPaymentsBusiness.createOrganisationByPersonId(
      personId,
      orgDetails
    )
    const business = transformOrganisationToBusiness(response)
    const result = { success: true, business }
    return result
  },
  createBusinessCustomerBankDetails: async (_, { input }, { dataSources }) => {
    const { sbi, crn } = input
    const { ruralPaymentsBusiness } = dataSources

    const organisation = await ruralPaymentsBusiness.getOrganisationBySBI(sbi)
    if (!organisation.businessReference) {
      throw new NotFound('FRN not found for business')
    }

    const personId = await retrievePersonIdByCRN(crn, dataSources)
    const organisationId = `${organisation.id}`

    const submission = transformBankChangeInputToSubmission(input, {
      organisationId,
      personId: `${personId}`,
      frn: organisation.businessReference
    })

    const validation = await ruralPaymentsBusiness.validateBankChange(submission)
    if (validation.status === 'FAILED') {
      if (validation.attemptsRemaining === 0) {
        return {
          __typename: 'BankDetailsLocked',
          message: validation.message || 'Bank details failed validation'
        }
      }
      return {
        __typename: 'BankDetailsValidationFailed',
        message: validation.message || 'Bank details failed validation',
        attemptsRemaining: validation.attemptsRemaining
      }
    }

    await ruralPaymentsBusiness.submitBankChange(submission)
    return { __typename: 'BankDetailsSubmitted', success: true }
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
  updateBusinessLock: businessLockResolver,
  updateBusinessUnlock: businessUnlockResolver
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}
