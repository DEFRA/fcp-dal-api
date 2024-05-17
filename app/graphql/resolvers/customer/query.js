import { ruralPaymentsPortalCustomerTransformer } from '../../../transformers/rural-payments-portal/customer.js'

export const Query = {
  async customer (__, { crn }, { authorize, dataSources }) {
    authorize.checkAuthGroup('ADMIN')
    const response = await dataSources.ruralPaymentsPortalApi.getCustomerByCRN(crn)
    return ruralPaymentsPortalCustomerTransformer(response)
  }
}
