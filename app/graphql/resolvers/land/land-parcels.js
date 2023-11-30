import { transformRuralPaymentsAgencyLandAPILandCovers } from '../../../transformers/rural-payments-agency-land-api.js'

export const LandParcel = {
  async covers ({ sbi, id }, __, { dataSources }) {
    return transformRuralPaymentsAgencyLandAPILandCovers(
      id,
      await dataSources.ruralPaymentAgencyLandAPI.getLandCoversBySbi(sbi)
    )
  }
}
