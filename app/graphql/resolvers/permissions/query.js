import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments/permissions.js'

export const Query = {
  async permissionGroups(_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  }
}

export const Permission = {
  async active(permissionGroup, { crn, sbi }, { dataSources }) {
    const [person, organisation] = await Promise.all([
      dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn),
      dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)
    ])

    const orgCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisation.id
      )

    return (
      transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
        person.id,
        [permissionGroup],
        orgCustomers
      ) === permissionGroup.level
    )
  }
}
