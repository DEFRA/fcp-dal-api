import { transformOrganisationToBusiness } from '../../../transformers/rural-payments/business.js'

export const Query = {
  async business(__, { sbi }, { dataSources }) {
    const orgId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
    const response = await dataSources.ruralPaymentsBusiness.getOrganisationById(orgId)

    const business = transformOrganisationToBusiness(response)
    return {
      sbi,
      land: { sbi },
      ...business
    }
  }
}
