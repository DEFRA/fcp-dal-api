import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels,
  transformTotalArea,
  transformTotalParcels
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
    return transformTotalParcels(await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationId(
      organisationId
    ))
  },

  async totalArea ({ organisationId, historicDate = new Date() }, __, { dataSources }) {
    return transformTotalArea(await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
      organisationId,
      historicDate
    ))
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
