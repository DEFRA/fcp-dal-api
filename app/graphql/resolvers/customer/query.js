import { ruralPaymentsPortalCustomerTransformer } from '../../../transformers/rural-payments-portal/customer.js'

export const Query = {
  async customer(__, { id }, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getCustomerByCRN(id)
    return ruralPaymentsPortalCustomerTransformer(response)
  }
}
