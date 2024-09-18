import { NotFound } from '../../../errors/graphql.js'
import { logger } from '../../../logger/logger.js'
import { sampleResponse } from '../../../logger/utils.js'
import { transformOrganisationCSApplicationToBusinessApplications } from '../../../transformers/rural-payments/applications-cs.js'
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
    logger.verbose('Get business customers', { organisationId })
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    logger.debug('Got business customers', {
      organisationId,
      customers: sampleResponse(customers)
    })
    return transformOrganisationCustomers(customers)
  },

  async customer ({ organisationId, sbi }, { crn }, { dataSources }) {
    logger.verbose('Get business customer', { crn, organisationId, sbi })

    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    const customer = customers.find(
      ({ customerReference }) => customerReference === crn
    )

    if (!customer) {
      logger.warn('Could not find customer in business', { crn, organisationId, sbi })
      throw new NotFound('Customer not found')
    }

    logger.debug('Got business customer', {
      crn,
      sbi,
      organisationId,
      customer
    })
    return transformOrganisationCustomer(customer)
  },

  async applications ({ organisationId }, __, { dataSources }) {
    const response =
      await dataSources.ruralPaymentsPortalApi.getApplicationsCountrysideStewardship(
        organisationId
      )
    return transformOrganisationCSApplicationToBusinessApplications(
      response?.applications
    )
  }
}

export const BusinessCustomer = {
  async permissionGroups ({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(
      privileges,
      dataSources.permissions.getPermissionGroups()
    )
  }
}
