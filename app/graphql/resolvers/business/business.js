import { transformOrganisationCPH } from '../../../transformers/rural-payments-portal/business-cph.js'
import { transformOrganisationCustomers } from '../../../transformers/rural-payments-portal/business.js'
import { transformPrivilegesListToBusinessCustomerPermissions } from '../../../transformers/rural-payments-portal/permissions.js'

export const Business = {
  land ({ id }) {
    return { id }
  },

  async cph ({ id }, _, { dataSources }) {
    return transformOrganisationCPH(id, await dataSources.ruralPaymentsPortalApi.getOrganisationCPHCollectionBySBI(id))
  },

  async customers ({ id }, _, { dataSources }) {
    return transformOrganisationCustomers(await dataSources.ruralPaymentsPortalApi.getOrganisationCustomersByOrganisationId(id))
  }
}

export const BusinessCustomer = {
  permissions ({ privileges }, __, { dataSources }) {
    return transformPrivilegesListToBusinessCustomerPermissions(privileges, dataSources.permissions.getPermissionGroups())
  }
}
