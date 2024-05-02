import { transformAuthenticateQuestionsAnswers } from '../../../transformers/authenticate/question-answers.js'
import {
  transformNotificationsToMessages,
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../transformers/rural-payments-portal/customer.js'
import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../transformers/rural-payments-portal/permissions.js'

export const Customer = {
  async business ({ id }, { sbi }, { dataSources }) {
    return transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
      id,
      sbi,
      await dataSources.ruralPaymentsPortalApi.getPersonSummaryByPersonId(id, sbi)
    )
  },
  async businesses ({ id }, __, { dataSources }) {
    const summary = await dataSources.ruralPaymentsPortalApi.getPersonSummaryByPersonId(id)
    return transformPersonSummaryToCustomerAuthorisedBusinesses(id, summary)
  },
  async authenticationQuestions ({ id }, __, { dataSources }) {
    const results = await dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN(id)
    return transformAuthenticateQuestionsAnswers(results)
  }
}

export const CustomerBusiness = {
  async roles ({ id, customerId }, __, { dataSources }) {
    const authorisation = await dataSources.ruralPaymentsPortalApi.getAuthorisationByOrganisationId(id)
    return transformPersonRolesToCustomerAuthorisedBusinessesRoles(customerId, authorisation.personRoles)
  },

  async messages ({ id, customerId }, { pagination, showOnlyDeleted }, { dataSources }) {
    const defaultPaginationPage = 1
    const defaultPaginationPerPage = 5

    const notifications = await dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId(
      id,
      customerId,
      pagination?.page || defaultPaginationPage,
      pagination?.perPage || defaultPaginationPerPage
    )

    return transformNotificationsToMessages(notifications, showOnlyDeleted)
  },

  async permissionGroups ({ id, customerId }, __, { dataSources }) {
    return dataSources.permissions.getPermissionGroups().map(permissionGroup => ({ ...permissionGroup, businessId: id, customerId }))
  }
}

export const CustomerBusinessPermissionGroup = {
  async level ({ businessId, customerId, permissions }, __, { dataSources }) {
    const authorisation = await dataSources.ruralPaymentsPortalApi.getAuthorisationByOrganisationId(businessId)
    return transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(customerId, permissions, authorisation.personPrivileges)
  }
}
