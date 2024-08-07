import { transformOrganisationCPH } from '../../../transformers/rural-payments-portal/business-cph.js'
import { transformBusinessCustomerPrivilegesToPermissionGroups, transformOrganisationCustomers } from '../../../transformers/version-one/business.js'
import { transformOrganisationCSApplicationToBusinessApplications } from '../../../transformers/rural-payments-portal/applications-cs.js'

export const Business = {
  land ({ businessId }) {
    return { businessId }
  },

  async cph ({ businessId }, _, { dataSources }) {
    return transformOrganisationCPH(businessId, await dataSources.ruralPaymentsPortalApi.getOrganisationCPHCollectionBySBI(businessId))
  },

  async customers ({ businessId }, _, { dataSources }) {
    return transformOrganisationCustomers(await dataSources.versionOneBusiness.getOrganisationCustomersByOrganisationId(businessId))
  },

  async applications ({ businessId }, __, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getApplicationsCountrysideStewardship(businessId)
    return transformOrganisationCSApplicationToBusinessApplications(response?.applications)
  }
}

export const BusinessCustomer = {
  async permissionGroups ({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(privileges, dataSources.permissions.getPermissionGroups())
  }
}
