import { transformOrganisationCPHCoordinates } from '../../../transformers/rural-payments-portal/business-cph.js'

export const CPH = {
  async parish ({ id, number }, _, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getOrganisationCPHInfoBySBIAndCPHNumber(id, number)

    return response.parish
  },

  async startDate ({ id, number }, __, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getOrganisationCPHInfoBySBIAndCPHNumber(id, number)

    // Convert timestamp milliseconds to seconds
    return parseInt(response.startDate) / 1000
  },

  async expiryDate ({ id, number }, __, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getOrganisationCPHInfoBySBIAndCPHNumber(id, number)

    // Convert timestamp milliseconds to seconds
    return parseInt(response.expiryDate) / 1000
  },

  async species ({ id, number }, __, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getOrganisationCPHInfoBySBIAndCPHNumber(id, number)

    return response.species
  },

  async coordinate ({ id, number }, __, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getOrganisationCPHInfoBySBIAndCPHNumber(id, number)

    return transformOrganisationCPHCoordinates(response)
  }
}
