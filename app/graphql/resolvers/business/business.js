import { NotFound } from '../../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../../logger/codes.js'
import { logger } from '../../../logger/logger.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformCountyParishHoldings,
  transformOrganisationCustomer,
  transformOrganisationCustomers
} from '../../../transformers/rural-payments/business.js'

export const Business = {
  land({ organisationId }) {
    return { organisationId }
  },

  async countyParishHoldings({ sbi }, __, { dataSources }) {
    const countyParishHoldings =
      await dataSources.ruralPaymentsBusiness.getCountyParishHoldingsBySBI(sbi)

    return transformCountyParishHoldings(countyParishHoldings)
  },

  async customers({ organisationId }, _, { dataSources }) {
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    return transformOrganisationCustomers(customers)
  },

  async customer({ organisationId, sbi }, { crn }, { dataSources }) {
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    const customer = customers.find(({ customerReference }) => customerReference === crn)

    if (!customer) {
      logger.warn('Could not find customer in business', {
        crn,
        organisationId,
        sbi,
        code: RURALPAYMENTS_API_NOT_FOUND_001
      })
      throw new NotFound('Customer not found')
    }

    return transformOrganisationCustomer(customer)
  }
}

export const BusinessCustomer = {
  async permissionGroups({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(
      privileges,
      dataSources.permissions.getPermissionGroups()
    )
  }
}
