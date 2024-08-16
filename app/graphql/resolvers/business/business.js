import { transformOrganisationCPH } from '../../../transformers/rural-payments/business-cph.js'
import { transformBusinessCustomerPrivilegesToPermissionGroups } from '../../../transformers/rural-payments/business.js'
import { transformOrganisationCustomers } from '../../../transformers/rural-payments/business.js'
import { transformOrganisationCSApplicationToBusinessApplications } from '../../../transformers/rural-payments/applications-cs.js'

export const Business = {
  land ({ organisationId }) {
    return { organisationId }
  },

  async cph ({ organisationId }, _, { dataSources }) {
    return transformOrganisationCPH(
      organisationId,
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHCollectionByOrganisationId(
        organisationId
      )
    )
  },

  async customers ({ organisationId }, _, { dataSources }) {
    return transformOrganisationCustomers(
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    )
  },

  async applications ({ organisationId }, __, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsPortalApi.getApplicationsCountrysideStewardship(
        organisationId
      )
    return transformOrganisationCSApplicationToBusinessApplications(
      response?.applications
    )
  }
}

export const BusinessCustomer = {
  async permissionGroups ({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(
      privileges,
      dataSources.permissions.getPermissionGroups()
    )
  }
}
