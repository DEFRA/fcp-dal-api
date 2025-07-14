import { transformBusinessDetailsToOrgDetailsUpdate } from '../../../transformers/rural-payments/business.js'

export const businessDetailsUpdateResolver = async (__, { input }, { dataSources }) => {
  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(input.sbi)
  const currentOrgDetails =
    await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
  const newOrgDetails = transformBusinessDetailsToOrgDetailsUpdate(input)
  const orgDetails = { ...currentOrgDetails, ...newOrgDetails }
  await dataSources.ruralPaymentsBusiness.updateOrganisationDetails(organisationId, orgDetails)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}
