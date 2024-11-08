import { NotFound } from '../../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../../logger/codes.js'
import { logger } from '../../../logger/logger.js'
import { transformOrganisationCPH } from '../../../transformers/rural-payments/business-cph.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationCustomer,
  transformOrganisationCustomers
} from '../../../transformers/rural-payments/business.js'

export const Business = {
  land ({ organisationId }) {
    return { organisationId }
  },

  async cph ({ organisationId }, _, { dataSources }) {
    return transformOrganisationCPH(
      organisationId,
      await dataSources.ruralPaymentsBusiness.getOrganisationCPHCollectionByOrganisationId(
        organisationId
      )
    )
  },

  async customers ({ organisationId }, _, { dataSources }) {
    logger.silly('Get business customers', { organisationId })
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    logger.silly('Got business customers', {
      organisationId,
      response: { body: customers }
    })
    return transformOrganisationCustomers(customers)
  },

  async customer ({ organisationId, sbi }, { crn }, { dataSources }) {
    logger.silly('Get business customer', { crn, organisationId, sbi })

    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    const customer = customers.find(
      ({ customerReference }) => customerReference === crn
    )

    if (!customer) {
      logger.warn('Could not find customer in business', { crn, organisationId, sbi, code: RURALPAYMENTS_API_NOT_FOUND_001 })
      throw new NotFound('Customer not found')
    }

    logger.silly('Got business customer', {
      crn,
      sbi,
      organisationId,
      customer
    })
    return transformOrganisationCustomer(customer)
  }
}

export const BusinessCustomerDetail = {
  async permissionGroups ({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(
      privileges,
      dataSources.permissions.getPermissionGroups()
    )
  }
}
