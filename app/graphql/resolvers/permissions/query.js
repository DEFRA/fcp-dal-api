import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments-portal/permissions.js'

export const Query = {
  async permissionGroups (_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  }
}

export const Permission = {
  async active (permissionGroup, { customerId, businessId }, { dataSources }) {
    const authorisation = await dataSources.ruralPaymentsPortalApi.getAuthorisationByOrganisationIdAndPersonId(businessId, customerId)
    return transformOrganisationAuthorisationToCustomerBusinessPermissionLevel([permissionGroup], authorisation) === permissionGroup.level
  }
}
