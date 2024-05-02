import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments-portal/permissions.js'

export const Query = {
  async permissionGroups (_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  }
}

export const Permission = {
  async active (permissionGroup, { customerId, businessId }, { dataSources }) {
    const authorisation = await dataSources.ruralPaymentsPortalApi.getAuthorisationByOrganisationId(businessId)
    return transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(customerId, [permissionGroup], authorisation.personPrivileges) === permissionGroup.level
  }
}
