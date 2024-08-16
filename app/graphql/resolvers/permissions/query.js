import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments/permissions.js'

export const Query = {
  async permissionGroups (_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  }
}

export const Permission = {
  async active (permissionGroup, { crn, sbi }, { dataSources }) {
    const { id: customerId } =
      await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)

    const { id: businessId } =
      await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)

    const authorisation =
      await dataSources.ruralPaymentsBusiness.getAuthorisationByOrganisationId(
        businessId
      )

    return (
      transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
        customerId,
        [permissionGroup],
        authorisation
      ) === permissionGroup.level
    )
  }
}
