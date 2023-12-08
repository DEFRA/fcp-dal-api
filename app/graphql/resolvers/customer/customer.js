import {
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges,
  transformPersonSummaryToCustomerAuthorisedBusinesses
} from '../../../transformers/rural-payments-portal/customer.js'

export const Customer = {
  async businesses ({ id }, __, { dataSources }) {
    const summary = await dataSources.ruralPaymentsPortalApi.getPersonSummaryByPersonId(id)
    return transformPersonSummaryToCustomerAuthorisedBusinesses(id, summary)
  }
}

export const CustomerBusiness = {
  async roles ({ id, customerId }, __, { dataSources }) {
    const authorisation = await dataSources.ruralPaymentsPortalApi.getAuthorisationByOrganisationId(id)
    return transformPersonRolesToCustomerAuthorisedBusinessesRoles(customerId, authorisation.personRoles)
  },

  async privileges ({ id, customerId }, __, { dataSources }) {
    const authorisation = await dataSources.ruralPaymentsPortalApi.getAuthorisationByOrganisationId(id)
    return transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges(customerId, authorisation.personPrivileges)
  }
}
