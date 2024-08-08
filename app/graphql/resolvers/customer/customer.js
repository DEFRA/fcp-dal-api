import { transformAuthenticateQuestionsAnswers } from '../../../transformers/authenticate/question-answers.js'
import {
  ruralPaymentsPortalCustomerTransformer,
  transformNotificationsToMessages,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../transformers/rural-payments-portal/customer.js'
import {
  transformBusinessCustomerToCustomerPermissionGroups, transformBusinessCustomerToCustomerRole,
  transformPersonSummaryToCustomerAuthorisedBusinesses
} from '../../../transformers/version-one/customer.js'
import logger from '../../../utils/logger.js'

export const Customer = {
  async customerId ({ crn }, __, { dataSources }) {
    const { id: customerId } = await dataSources.versionOneCustomer.getCustomerByCRN(crn)
    logger.info('Get customer id from crn', { crn, customerId })
    return customerId
  },

  async info ({ crn }, __, { dataSources }) {
    const response = await dataSources.versionOneCustomer.getCustomerByCRN(crn)
    return ruralPaymentsPortalCustomerTransformer(response)
  },

  async business ({ crn }, { sbi }, { dataSources }) {
    const { id: customerId } = await dataSources.versionOneCustomer.getCustomerByCRN(crn)

    return transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
      customerId,
      sbi,
      await dataSources.versionOneCustomer.getPersonBusinessesByPersonId(customerId, sbi)
    )
  },

  async businesses ({ crn }, __, { dataSources }) {
    const { id: customerId } = await dataSources.versionOneCustomer.getCustomerByCRN(crn)
    const summary = await dataSources.versionOneCustomer.getPersonBusinessesByPersonId(customerId)
    logger.info('Get customer businesses', { crn, customerId, summary })
    return transformPersonSummaryToCustomerAuthorisedBusinesses({ customerId, crn }, summary)
  },

  async authenticationQuestions ({ crn }, __, { dataSources }) {
    const results = await dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN(crn)
    return transformAuthenticateQuestionsAnswers(results)
  }
}

export const CustomerBusiness = {
  async role ({ businessId, crn }, __, { dataSources }) {
    logger.info('Get customer business role', { crn, businessId })
    const businessCustomers = await dataSources.versionOneBusiness.getOrganisationCustomersByOrganisationId(businessId)
    return transformBusinessCustomerToCustomerRole(crn, businessCustomers)
  },

  async messages ({ businessId, customerId }, { pagination, showOnlyDeleted }, { dataSources }) {
    const defaultPaginationPage = 1
    const defaultPaginationPerPage = 5

    const notifications = await dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId(
      businessId,
      customerId,
      pagination?.page || defaultPaginationPage,
      pagination?.perPage || defaultPaginationPerPage
    )

    return transformNotificationsToMessages(notifications, showOnlyDeleted)
  },

  async permissionGroups ({ businessId, crn }, __, { dataSources }) {
    const businessCustomers = await dataSources.versionOneBusiness.getOrganisationCustomersByOrganisationId(businessId)

    return transformBusinessCustomerToCustomerPermissionGroups(crn, businessCustomers, dataSources.permissions.getPermissionGroups())
  }
}
