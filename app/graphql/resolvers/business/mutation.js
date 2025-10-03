import {
  transformBusinessDetailsToOrgDetailsCreate,
  transformOrganisationToBusiness
} from '../../../transformers/rural-payments/business.js'
import { retrievePersonIdByCRN } from '../customer/common.js'
import { businessAdditionalDetailsUpdateResolver, businessDetailsUpdateResolver } from './common.js'
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
  updateBusinessName: businessDetailsUpdateResolver,
  updateBusinessPhone: businessDetailsUpdateResolver,
  updateBusinessEmail: businessDetailsUpdateResolver,
  updateBusinessAddress: businessDetailsUpdateResolver,
  updateBusinessVAT: businessDetailsUpdateResolver,
  updateBusinessLegalStatus: businessAdditionalDetailsUpdateResolver,
  updateBusinessType: businessAdditionalDetailsUpdateResolver,
  updateBusinessDateStartedFarming: businessAdditionalDetailsUpdateResolver,
  updateBusinessRegistrationNumbers: businessAdditionalDetailsUpdateResolver
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}
