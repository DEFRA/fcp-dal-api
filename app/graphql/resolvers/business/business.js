import { transformOrganisationCPH } from '../../../transformers/rural-payments-portal/business-cph.js'
import { transformBusinessCustomerPrivilegesToPermissionGroups, transformOrganisationCustomers } from '../../../transformers/version-one/business.js'

export const Business = {
  land ({ businessId }) {
    return { businessId }
  },

  async cph ({ businessId }, _, { dataSources }) {
    return transformOrganisationCPH(businessId, await dataSources.ruralPaymentsPortalApi.getOrganisationCPHCollectionBySBI(businessId))
  },

  async customers ({ businessId }, _, { dataSources }) {
    return transformOrganisationCustomers(await dataSources.versionOneBusiness.getOrganisationCustomersByOrganisationId(businessId))
  }
}

export const BusinessCustomer = {
  async permissionGroups ({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(privileges, dataSources.permissions.getPermissionGroups())
  }
}
