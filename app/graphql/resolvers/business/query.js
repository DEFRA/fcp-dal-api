import { transformOrganisationToBusiness } from '../../../transformers/rural-payments-portal/business.js'

export const Query = {
  async business (__, { sbi }, { dataSources }) {
    const response = await dataSources.versionOneBusiness.getOrganisationBySBI(sbi)
    const business = transformOrganisationToBusiness(response)
    return {
      sbi,
      land: { sbi },
      ...business
    }
  }
}
