import { transformOrganisationToBusiness } from '../../../transformers/rural-payments/business.js'
import { getOrgId } from '../business/common.js'

export const Query = {
  async business(__, { sbi }, { dataSources, kits }) {
    const orgId = await getOrgId(dataSources, sbi, kits)

    const response = await dataSources.ruralPaymentsBusiness.getOrganisationById(orgId)

    const business = transformOrganisationToBusiness(response)
    return {
      sbi,
      land: { sbi },
      ...business
    }
  }
}
