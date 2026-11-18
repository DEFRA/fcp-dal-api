import { transformPageInfo } from '../../../transformers/common.js'
import { transformPersonSearchResult } from '../../../transformers/rural-payments/customer.js'
import { retrievePersonIdByCRN } from './common.js'

/**
 * @import {
 *   GraphQLResolveInfo,
 *   QueryCustomerArgs,
 *   QueryCustomerSearchArgs,
 *   QueryIsCustomerEmailRegisteredArgs,
 *   ResolverContext
 * } from '../types.js'
 */

export const Query = {
  /**
   * @param {unknown} __
   * @param {QueryCustomerArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async customer(__, { crn }, { dataSources, auditTrail }, info) {
    auditTrail?.recordAccount(info, 'crn', crn)
    const personId = await retrievePersonIdByCRN(crn, dataSources)
    auditTrail?.recordAccount(info, 'personId', personId)
    return { crn, personId }
  },

  /**
   * @param {unknown} __
   * @param {QueryCustomerSearchArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async customerSearch(
    __,
    { searchString, searchType, pagination },
    { dataSources, auditTrail },
    info
  ) {
    if (searchType === 'CRN') {
      auditTrail?.recordAccount(info, 'crn', searchString)
    }
    auditTrail?.recordEntity(info, {
      entity: 'person',
      action: 'search',
      ...(searchType === 'CRN' ? { entityid: searchString } : {})
    })
    const { data, page } = await dataSources.ruralPaymentsCustomer.personSearch(
      searchType,
      searchString,
      pagination
    )

    return {
      results: data.map(transformPersonSearchResult),
      pageInfo: transformPageInfo(page)
    }
  },

  /**
   * @param {unknown} __
   * @param {QueryIsCustomerEmailRegisteredArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async isCustomerEmailRegistered(__, { email }, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'person',
      action: 'search',
      entityid: email
    })
    const { emailDuplicated } = await dataSources.ruralPaymentsCustomer.validateEmail(email)
    return emailDuplicated
  }
}
