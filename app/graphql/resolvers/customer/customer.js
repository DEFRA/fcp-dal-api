import { transformAuthenticateQuestionsAnswers } from '../../../transformers/authenticate/question-answers.js'
import {
  ruralPaymentsPortalCustomerTransformer,
  transformBusinessCustomerToCustomerPermissionGroups,
  transformBusinessCustomerToCustomerRole,
  transformNotificationsToMessages,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../transformers/rural-payments/customer.js'
import { logger } from '../../../utils/logger.js'

export const Customer = {
  async personId ({ crn }, __, { dataSources }) {
    const { id: personId } =
      await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)
    logger.debug('Get customer id from crn', { crn, personId })
    return personId
  },

  async info ({ crn }, __, { dataSources }) {
    const response = await dataSources.ruralPaymentsCustomer.getCustomerByCRN(
      crn
    )
    return ruralPaymentsPortalCustomerTransformer(response)
  },

  async business ({ crn }, { sbi }, { dataSources }) {
    logger.verbose('Get customer business', { crn, sbi })

    const { id: personId } = await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)

    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(
      personId,
      sbi
    )

    logger.verbose('Got customer business', { crn, sbi, personId, summary })
    return transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
      { personId, crn, sbi },
      summary
    )
  },

  async businesses ({ crn }, __, { dataSources }) {
    const { id: personId } = await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)

    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(
      personId
    )

    logger.debug('Get customer businesses', { crn, personId, summary })
    return transformPersonSummaryToCustomerAuthorisedBusinesses(
      { personId, crn },
      summary
    )
  },

  async authenticationQuestions (
    { crn },
    { entraIdUserObjectId },
    { dataSources }
  ) {
    const employeeId = await dataSources.entraIdApi.getEmployeeId(
      entraIdUserObjectId
    )
    const results =
      await dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN(
        crn,
        employeeId
      )

    logger.info('customer resolver: answers retrieved')
    return transformAuthenticateQuestionsAnswers(results)
  }
}

export const CustomerBusiness = {
  async role ({ organisationId, crn }, __, { dataSources }) {
    logger.debug('Get customer business role', { crn, organisationId })
    const businessCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    return transformBusinessCustomerToCustomerRole(crn, businessCustomers)
  },

  async messages (
    { organisationId, personId },
    { pagination, showOnlyDeleted },
    { dataSources }
  ) {
    const defaultPaginationPage = 1
    const defaultPaginationPerPage = 5

    const notifications =
      await dataSources.ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
        organisationId,
        personId,
        pagination?.page || defaultPaginationPage,
        pagination?.perPage || defaultPaginationPerPage
      )

    return transformNotificationsToMessages(notifications, showOnlyDeleted)
  },

  async permissionGroups ({ organisationId, crn }, __, { dataSources }) {
    const businessCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    const permissionGroups = dataSources.permissions.getPermissionGroups()

    return transformBusinessCustomerToCustomerPermissionGroups(
      crn,
      businessCustomers,
      permissionGroups
    )
  }
}
