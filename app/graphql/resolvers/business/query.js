import { transformPageInfo } from '../../../transformers/common.js'
import { transformOrganisationSearchResult } from '../../../transformers/rural-payments/business.js'
import { retrieveOrgIdBySbi } from './common.js'

/**
 * @import {
 *   GraphQLResolveInfo,
 *   QueryBusinessArgs,
 *   QueryBusinessSearchArgs,
 *   ResolverContext
 * } from '../types.js'
 */

export const Query = {
  /**
   * @param {unknown} __
   * @param {QueryBusinessArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} [info] omitted when called by `UpdateBusinessResponse.business`
   */
  async business(__, { sbi }, { dataSources, auditTrail, defraIdContext }, info) {
    auditTrail?.recordAccount(info, 'sbi', sbi)
    const organisationId = await retrieveOrgIdBySbi(sbi, { dataSources, defraIdContext })

    auditTrail?.recordAccount(info, 'organisationId', organisationId)

    return {
      sbi,
      organisationId,
      land: { sbi },
      payments: { sbi }
    }
  },

  /**
   * @param {unknown} __
   * @param {QueryBusinessSearchArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async businessSearch(
    __,
    { searchString, searchType, pagination },
    { dataSources, auditTrail },
    info
  ) {
    if (searchType === 'SBI') {
      auditTrail?.recordAccount(info, 'sbi', searchString)
    }
    auditTrail?.recordEntity(info, {
      entity: 'business',
      action: 'search',
      ...(searchType === 'SBI' ? { entityid: searchString } : {})
    })

    const { data, page } = await dataSources.ruralPaymentsBusiness.organisationSearch(
      searchType,
      searchString,
      pagination
    )

    return {
      results: data.map(transformOrganisationSearchResult),
      pageInfo: transformPageInfo(page)
    }
  }
}
