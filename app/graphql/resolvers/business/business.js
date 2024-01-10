import { transformOrganisationCPH } from '../../../transformers/rural-payments-portal/business-cph.js'

export const Business = {
  land ({ id }) {
    return { id }
  },

  async cph ({ id }, _, { dataSources }) {
    return transformOrganisationCPH(
      id,
      await dataSources.ruralPaymentsPortalApi.getOrganisationCPHCollectionBySBI(id)
    )
  }
}
