import { transformLandCovers, transformLandCoversToArea, transformLandParcels } from '../../../transformers/rural-payments-portal/lms.js'

export const BusinessLand = {
  summary ({ businessId }) {
    return { businessId }
  },

  async parcels ({ businessId }, __, { dataSources }) {
    return transformLandParcels(await dataSources.ruralPaymentsPortalApi.getParcelsByOrganisationId(businessId))
  },

  async covers ({ businessId }, __, { dataSources }) {
    return transformLandCovers(await dataSources.ruralPaymentsPortalApi.getCoversByOrganisationId(businessId))
  }
}

export const BusinessLandSummary = {
  async totalParcels ({ businessId }, __, { dataSources }) {
    const { totalParcels } = await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(businessId)
    return totalParcels
  },

  async totalArea ({ businessId }, __, { dataSources }) {
    const { totalArea } = await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(businessId)
    return totalArea
  },

  async arableLandArea ({ businessId }, __, { dataSources }) {
    return transformLandCoversToArea('Arable Land', await dataSources.ruralPaymentsPortalApi.getCoversSummaryByOrganisationId(businessId))
  },

  async permanentGrasslandArea ({ businessId }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Grassland',
      await dataSources.ruralPaymentsPortalApi.getCoversSummaryByOrganisationId(businessId)
    )
  },

  async permanentCropsArea ({ businessId }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Crops',
      await dataSources.ruralPaymentsPortalApi.getCoversSummaryByOrganisationId(businessId)
    )
  }
}
