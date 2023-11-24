import {
  transformRuralPaymentsAgencyLandAPILandParcels,
  transformRuralPaymentsAgencyLandAPILandParcelsToSummary
} from '../../../transformers/rural-payments-agency-land-api.js'

export const Land = {
  async summary ({ sbi }, __, { dataSources }) {
    return transformRuralPaymentsAgencyLandAPILandParcelsToSummary(
      await dataSources.ruralPaymentsAgencyLandAPI.getLandParcelsBySbi(sbi)
    )
  },

  async parcels ({ sbi }, __, { dataSources }) {
    return transformRuralPaymentsAgencyLandAPILandParcels(
      sbi,
      await dataSources.ruralPaymentsAgencyLandAPI.getLandParcelsBySbi(sbi)
    )
  }
}
