/**
 * @import { GraphQLResolveInfo, ResolverContext } from '../types.js'
 */

export const Query = {
  referenceData() {
    return {}
  }
}

export const ReferenceData = {
  /**
   * @param {unknown} __
   * @param {unknown} ___
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async countriesCurrencies(__, ___, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'reference-data',
      action: 'read',
      entityid: 'countries-currencies'
    })
    const { countriesCurrency } = await dataSources.ruralPaymentsReferenceData.getCountryCodes()
    return Object.entries(countriesCurrency).map(([code, currency]) => ({ code, currency }))
  },

  /**
   * @param {unknown} __
   * @param {unknown} ___
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async legalStatuses(__, ___, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'reference-data',
      action: 'read',
      entityid: 'business-legal-statuses'
    })
    const { _data: legalStatuses } =
      await dataSources.ruralPaymentsReferenceData.getReferenceData('legalstatus')
    return legalStatuses.map(({ id, type }) => ({ code: id, description: type }))
  }
}
