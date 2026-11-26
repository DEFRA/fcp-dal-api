import { retrieveOrgIdBySbi } from '../business/common.js'
import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments/permissions.js'

export const Query = {
  async permissionGroups(_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  },

  internalUser() {
    return {}
  }
}

export const InternalUser = {
  async permittedFunctions(_, { functions }, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, { entity: 'permitted-function-list', action: 'read' })
    const authorisedFunctions =
      await dataSources.ruralPaymentsCustomer.getInternalUserAuthorisedFunctions(functions)

    return functions.map((name) => ({ name, permitted: authorisedFunctions?.[name] ?? false }))
  }
}

export const Permission = {
  async active(permissionGroup, { crn, sbi }, { dataSources, defraIdContext }) {
    const [person, organisationId] = await Promise.all([
      dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn),
      retrieveOrgIdBySbi(sbi, { dataSources, defraIdContext })
    ])

    const orgCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
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
