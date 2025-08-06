import { transformAuthenticateQuestionsAnswers } from '../../../transformers/authenticate/question-answers.js'
import {
  ruralPaymentsPortalCustomerTransformer,
  transformBusinessCustomerToCustomerPermissionGroups,
  transformBusinessCustomerToCustomerRole,
  transformNotificationsToMessages,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../transformers/rural-payments/customer.js'
import { validatePastDate } from '../../../utils/date.js'

const getPersonId = async (dataSources, crn, gatewayType) => {
  if (gatewayType == 'internal') {
    return await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(crn)
  } else {
    return await dataSources.ruralPaymentsCustomer.getExternalPersonId()
  }
}

export const Customer = {
  async personId({ crn }, __, { dataSources, kits }) {
    getPersonId(dataSources, crn, kits.gatewayType)
  },

  async info({ crn }, __, { dataSources, kits }) {
    let response
    if (kits.gatewayType == 'internal') {
      response = await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)
    } else {
      response = await dataSources.ruralPaymentsCustomer.getExternalPerson()
    }
    return ruralPaymentsPortalCustomerTransformer(response)
  },

  async business({ crn }, { sbi }, { dataSources, kits }) {
    const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(crn)

    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(personId)

    return transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
      { personId, crn, sbi },
      summary
    )
  },

  async businesses({ crn }, __, { dataSources, kits }) {
    const personId = await getPersonId(dataSources, crn, kits.gatewayType)

    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(personId)

    return transformPersonSummaryToCustomerAuthorisedBusinesses({ personId, crn }, summary)
  },

  async authenticationQuestions({ crn }, __, { dataSources }) {
    const results = await dataSources.ruralPaymentsCustomer.getAuthenticateAnswersByCRN(crn)
    return transformAuthenticateQuestionsAnswers(results)
  }
}

export const CustomerBusiness = {
  async role({ organisationId, crn }, __, { dataSources }) {
    const businessCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    return transformBusinessCustomerToCustomerRole(crn, businessCustomers)
  },

  async messages({ organisationId, personId }, { fromDate }, { dataSources }) {
    if (fromDate) {
      fromDate = validatePastDate(fromDate)
    }

    const notifications =
      await dataSources.ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
        organisationId,
        personId,
        fromDate
      )

    return transformNotificationsToMessages(notifications)
  },

  async permissionGroups({ organisationId, crn }, __, { dataSources }) {
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
