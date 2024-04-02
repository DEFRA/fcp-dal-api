import { ruralPaymentsPortalCustomerTransformer } from '../../../transformers/rural-payments-portal/customer.js'

export const Query = {
  async customer (__, { id }, { authorize, dataSources }) {
    // authorize.checkAuthGroup('ADMIN')
    const response = await dataSources.ruralPaymentsPortalApi.getCustomerByCRN(id)
    return ruralPaymentsPortalCustomerTransformer(response)
  }
}
