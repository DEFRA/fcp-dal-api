import { transformAuthenticateQuestionsAnswers } from '../../../transformers/authenticate/question-answers.js'
import {
  ruralPaymentsPortalCustomerTransformer,
  transformBusinessCustomerToCustomerPermissionGroups,
  transformBusinessCustomerToCustomerRole,
  transformNotificationsToMessages,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../transformers/rural-payments/customer.js'
import { validatePastDateInput } from '../../../utils/date.js'

export const Customer = {
  async info({ personId }, __, { dataSources, auditTrail }, info) {
    let response
    try {
      response = await dataSources.ruralPaymentsCustomer.getPersonByPersonId(personId)
    } finally {
      auditTrail?.recordEntity(info, {
        entity: 'person',
        action: 'read',
        entityid: response?.customerReferenceNumber
      })
    }
    return ruralPaymentsPortalCustomerTransformer(response)
  },

  async business({ personId, crn }, { sbi }, { dataSources, auditTrail }, info) {
    auditTrail?.recordAccount(info, 'sbi', sbi)
    auditTrail?.recordEntity(info, { entity: 'business-list', action: 'read', entityid: crn })
    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(personId)

    const transformedBusiness = transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
      { personId, crn, sbi },
      summary
    )

    auditTrail?.recordAccount(info, 'organisationId', transformedBusiness.organisationId)
    return transformedBusiness
  },

  async businesses({ personId, crn }, __, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, { entity: 'business-list', action: 'read', entityid: crn })
    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(personId)

    return transformPersonSummaryToCustomerAuthorisedBusinesses({ personId, crn }, summary)
  },

  async authenticationQuestions({ crn }, __, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'authenticate-question',
      action: 'read',
      entityid: crn
    })
    const results = await dataSources.ruralPaymentsCustomer.getAuthenticateAnswersByCRN(crn)
    return transformAuthenticateQuestionsAnswers(results)
  }
}

export const CustomerBusiness = {
  async role({ organisationId, crn, sbi }, __, { dataSources, auditTrail }, info) {
    auditTrail?.recordAccount(info, 'sbi', sbi)
    auditTrail?.recordAccount(info, 'organisationId', organisationId)
    auditTrail?.recordEntity(info, {
      entity: 'business-list',
      action: 'read',
      entityid: crn
    })
    const businessCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    return transformBusinessCustomerToCustomerRole(crn, businessCustomers)
  },

  async messages(
    { organisationId, sbi, personId, crn },
    { fromDate },
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordAccount(info, 'sbi', sbi)
    auditTrail?.recordAccount(info, 'organisationId', organisationId)
    auditTrail?.recordEntity(info, {
      entity: 'message-list',
      action: 'read',
      entityid: `${sbi}-${crn}`
    })
    if (fromDate) {
      fromDate = validatePastDateInput(fromDate)
    }

    const notifications =
      await dataSources.ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
        organisationId,
        personId,
        fromDate
      )

    return transformNotificationsToMessages(notifications)
  },

  async permissionGroups({ organisationId, sbi, crn }, __, { dataSources, auditTrail }, info) {
    auditTrail?.recordAccount(info, 'organisationId', organisationId)
    auditTrail?.recordAccount(info, 'sbi', sbi)
    auditTrail?.recordEntity(info, {
      entity: 'permission-list',
      action: 'read',
      entityid: `${sbi}-${crn}`
    })
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
