import { transformPageInfo } from '../../../transformers/common.js'
import { transformPersonSearchResult } from '../../../transformers/rural-payments/customer.js'
import { retrievePersonIdByCRN } from './common.js'

export const Query = {
  async customer(__, { crn }, { dataSources }) {
    const personId = await retrievePersonIdByCRN(crn, dataSources)

    return { crn, personId }
  },

  async customerSearch(__, { searchString, searchType, pagination }, { dataSources }) {
    const { data, page } = await dataSources.ruralPaymentsCustomer.personSearch(
      searchType,
      searchString,
      pagination
    )

    return {
      results: data.map(transformPersonSearchResult),
      pageInfo: transformPageInfo(page)
    }
  }
}
