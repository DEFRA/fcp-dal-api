import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels
} from '../../../transformers/rural-payments/lms.js'

export const BusinessLand = {
  summary ({ businessId }) {
    return { businessId }
  },

  async parcels ({ businessId }, __, { dataSources }) {
    return transformLandParcels(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationId(
        businessId
      )
    )
  },

  async covers ({ businessId }, __, { dataSources }) {
    return transformLandCovers(
      await dataSources.ruralPaymentsBu.getCoversByOrganisationId(businessId)
    )
  }
}

export const BusinessLandSummary = {
  async totalParcels ({ businessId }, __, { dataSources }) {
    const { totalParcels } =
      await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(
        businessId
      )
    return totalParcels
  },

  async totalArea ({ businessId }, __, { dataSources }) {
    const { totalArea } =
      await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(
        businessId
      )
    return totalArea
  },

  async arableLandArea ({ businessId }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Arable Land',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationId(
        businessId
      )
    )
  },

  async permanentGrasslandArea ({ businessId }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Grassland',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationId(
        businessId
      )
    )
  },

  async permanentCropsArea ({ businessId }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Crops',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationId(
        businessId
      )
    )
  }
}
