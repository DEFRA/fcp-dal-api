import { transformOrganisationCPHCoordinates } from '../../../transformers/rural-payments/business-cph.js'

export const CPH = {
  async parish ({ organisationId, number }, _, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHInfoByOrganisationIdAndCPHNumber(
        organisationId,
        number
      )
    return response.parish
  },

  async startDate ({ organisationId, number }, __, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHInfoByOrganisationIdAndCPHNumber(
        organisationId,
        number
      )
    // Convert timestamp milliseconds to seconds
    return parseInt(response.startDate) / 1000
  },

  async expiryDate ({ organisationId, number }, __, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHInfoByOrganisationIdAndCPHNumber(
        organisationId,
        number
      )

    // Convert timestamp milliseconds to seconds
    return parseInt(response.expiryDate) / 1000
  },

  async species ({ organisationId, number }, __, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHInfoByOrganisationIdAndCPHNumber(
        organisationId,
        number
      )

    return response.species
  },

  async coordinate ({ organisationId, number }, __, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHInfoByOrganisationIdAndCPHNumber(
        organisationId,
        number
      )

    return transformOrganisationCPHCoordinates(response)
  }
}
