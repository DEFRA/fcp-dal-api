import { transformPageInfo } from '../../../transformers/common.js'
import { transformPersonSearchResult } from '../../../transformers/rural-payments/customer.js'
import { retrievePersonIdByCRN } from './common.js'

export const Query = {
  async customer(__, { crn }, { dataSources, auditTrail }, info) {
    const personId = await retrievePersonIdByCRN(crn, dataSources)
    auditTrail?.recordAccount(info, 'personId', personId)
    auditTrail?.recordAccount(info, 'crn', crn)
    return { crn, personId }
  },

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

  async isCustomerEmailRegistered(__, { email }, { dataSources }) {
    const { emailDuplicated } = await dataSources.ruralPaymentsCustomer.validateEmail(email)
    return emailDuplicated
  }
}
