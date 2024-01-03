import { transformLandCovers, transformLandCoversToArea, transformLandParcels } from '../../../transformers/rural-payments-portal/lms.js'

export const BusinessLand = {
  summary ({ id }) {
    return { id }
  },

  async parcels ({ id }, __, { dataSources }) {
    return transformLandParcels(await dataSources.ruralPaymentsPortalApi.getParcelsByOrganisationId(id))
  },

  async covers ({ id }, __, { dataSources }) {
    return transformLandCovers(await dataSources.ruralPaymentsPortalApi.getCoversByOrganisationId(id))
  }
}

export const BusinessLandSummary = {
  async totalParcels ({ id }, __, { dataSources }) {
    const { totalParcels } = await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(id)
    return totalParcels
  },

  async totalArea ({ id }, __, { dataSources }) {
    const { totalArea } = await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(id)
    return totalArea
  },

  async arableLandArea ({ id }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Arable Land',
      await dataSources.ruralPaymentsPortalApi.getCoversSummaryByOrganisationId(id)
    )
  },

  async permanentGrasslandArea ({ id }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Grassland',
      await dataSources.ruralPaymentsPortalApi.getCoversSummaryByOrganisationId(id)
    )
  },

  async permanentCropsArea ({ id }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Crops',
      await dataSources.ruralPaymentsPortalApi.getCoversSummaryByOrganisationId(id)
    )
  }
}
