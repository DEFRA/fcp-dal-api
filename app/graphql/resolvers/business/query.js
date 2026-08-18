import { transformPageInfo } from '../../../transformers/common.js'
import { transformOrganisationSearchResult } from '../../../transformers/rural-payments/business.js'
import { retrieveOrgIdBySbi } from './common.js'

export const Query = {
  async business(__, { sbi }, { dataSources, auditTrail }, info) {
    const organisationId = await retrieveOrgIdBySbi(sbi, dataSources)

    auditTrail?.recordAccount(info, 'organisationId', organisationId)
    auditTrail?.recordAccount(info, 'sbi', sbi)

    return {
      sbi,
      organisationId,
      land: { sbi },
      payments: { sbi }
    }
  },

  async businessSearch(__, { searchString, searchType, pagination }, { dataSources }) {
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
