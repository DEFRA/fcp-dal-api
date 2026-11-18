import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments/permissions.js'

/**
 * @import {
 *   GraphQLResolveInfo,
 *   InternalUserPermittedFunctionsArgs,
 *   PermissionActiveArgs,
 *   ResolverContext
 * } from '../types.js'
 */

export const Query = {
  /**
   * @param {unknown} _
   * @param {unknown} __
   * @param {ResolverContext} context
   */
  async permissionGroups(_, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups()
  },

  internalUser() {
    return {}
  }
}

export const InternalUser = {
  /**
   * @param {unknown} _
   * @param {InternalUserPermittedFunctionsArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async permittedFunctions(_, { functions }, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, { entity: 'permitted-function-list', action: 'read' })
    const authorisedFunctions =
      await dataSources.ruralPaymentsCustomer.getInternalUserAuthorisedFunctions(functions)

    return functions.map((name) => ({ name, permitted: authorisedFunctions?.[name] ?? false }))
  }
}

export const Permission = {
  /**
   * @param {{ level: string }} permissionGroup
   * @param {PermissionActiveArgs} args
   * @param {ResolverContext} context
   */
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
