import { transformOrganisationToBusiness } from '../../../transformers/rural-payments/business.js'

export const Query = {
  async business (__, { sbi }, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)
    const business = transformOrganisationToBusiness(response)
    return {
      sbi,
      land: { sbi },
      ...business
    }
  }
}
