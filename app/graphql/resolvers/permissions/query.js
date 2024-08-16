import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments/permissions.js'

export const Query = {
  async permissionGroups (_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  }
}

export const Permission = {
  async active (permissionGroup, { crn, sbi }, { dataSources }) {
    const { id: personId } =
      await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)

    const { id: organisationId } =
      await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)

    const orgCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    return (
      transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
        personId,
        [permissionGroup],
        orgCustomers
      ) === permissionGroup.level
    )
  }
}
