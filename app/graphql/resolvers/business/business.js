import { transformOrganisationCSApplicationToBusinessApplications } from '../../../transformers/rural-payments/applications-cs.js'
import { transformOrganisationCPH } from '../../../transformers/rural-payments/business-cph.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationCustomer,
  transformOrganisationCustomers
} from '../../../transformers/rural-payments/business.js'
import { logger, sampleResponse } from '../../../utils/logger.js'

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
