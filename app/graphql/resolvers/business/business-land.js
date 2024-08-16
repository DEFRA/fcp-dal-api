import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels
} from '../../../transformers/rural-payments/lms.js'

export const BusinessLand = {
  summary ({ organisationId }) {
    return { organisationId }
  },

  async parcels ({ organisationId }, __, { dataSources }) {
    return transformLandParcels(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationId(
        organisationId
      )
    )
  },

  async covers ({ organisationId }, __, { dataSources }) {
    return transformLandCovers(
      await dataSources.ruralPaymentsBusiness.getCoversByOrganisationId(
        organisationId
      )
    )
  }
}

export const BusinessLandSummary = {
  async totalParcels ({ organisationId }, __, { dataSources }) {
    const { totalParcels } =
      await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(
        organisationId
      )
    return totalParcels
  },

  async totalArea ({ organisationId }, __, { dataSources }) {
    const { totalArea } =
      await dataSources.ruralPaymentsPortalApi.getParcelsSummaryByOrganisationId(
        organisationId
      )
    return totalArea
  },

  async arableLandArea (
    { organisationId, historicDate = new Date() },
    __,
    { dataSources }
  ) {
    return transformLandCoversToArea(
      'Arable Land',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        organisationId,
        historicDate
      )
    )
  },

  async permanentGrasslandArea (
    { organisationId, historicDate = new Date() },
    __,
    { dataSources }
  ) {
    return transformLandCoversToArea(
      'Permanent Grassland',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        organisationId,
        historicDate
      )
    )
  },

  async permanentCropsArea (
    { organisationId, historicDate = new Date() },
    __,
    { dataSources }
  ) {
    return transformLandCoversToArea(
      'Permanent Crops',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        organisationId,
        historicDate
      )
    )
  }
}
