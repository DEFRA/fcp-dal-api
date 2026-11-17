import { MAPPED_BUSINESS_SEARCH_MESSAGE } from '../../../auth/dummy-defra-id.js'
import { Forbidden } from '../../../errors/graphql.js'
import { transformPageInfo } from '../../../transformers/common.js'
import { transformOrganisationSearchResult } from '../../../transformers/rural-payments/business.js'
import { retrieveOrgIdBySbi } from './common.js'

export const Query = {
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

  async businessSearch(
    __,
    { searchString, searchType, pagination },
    { dataSources, auditTrail, defraIdContext },
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

    // A mapped Defra ID token is routed internally as the DAL service account, so a search would
    // return any business rather than only the mapped SBIs
    if (defraIdContext?.isMapped) {
      throw new Forbidden(MAPPED_BUSINESS_SEARCH_MESSAGE)
    }

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
