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

/**
 * @import {
 *   CustomerBusinessArgs,
 *   CustomerBusinessMessagesArgs,
 *   GraphQLResolveInfo,
 *   ResolverContext
 * } from '../types.js'
 */

/**
 * The customer returned by `Query.customer` and the customer mutations
 * @typedef {object} CustomerParent
 * @property {string} personId the Rural Payments id of the customer
 * @property {string} crn Customer Reference Number: a unique 10-digit number
 */

/**
 * A business returned by `Customer.business`/`Customer.businesses`
 * @typedef {object} CustomerBusinessParent
 * @property {string} organisationId the Rural Payments id of the business
 * @property {string} sbi Single Business Identifier: a unique 9-digit number
 * @property {string} name the name of the business
 * @property {string} personId the Rural Payments id of the customer
 * @property {string} crn Customer Reference Number: a unique 10-digit number
 */

const BUSINESS_LIST_ENTITY = 'business-list'

export const Customer = {
  /**
   * @param {CustomerParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
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

  /**
   * @param {CustomerParent} parent
   * @param {CustomerBusinessArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async business({ personId, crn }, { sbi }, { dataSources, auditTrail }, info) {
    auditTrail?.recordAccount(info, 'sbi', sbi)
    auditTrail?.recordEntity(info, { entity: BUSINESS_LIST_ENTITY, action: 'read', entityid: crn })
    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(personId)

    const transformedBusiness = transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
      { personId, crn, sbi },
      summary
    )

    if (transformedBusiness?.organisationId) {
      auditTrail?.recordAccount(info, 'organisationId', transformedBusiness?.organisationId)
    }
    return transformedBusiness
  },

  /**
   * @param {CustomerParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async businesses({ personId, crn }, __, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, { entity: BUSINESS_LIST_ENTITY, action: 'read', entityid: crn })
    const summary = await dataSources.ruralPaymentsCustomer.getPersonBusinessesByPersonId(personId)

    return transformPersonSummaryToCustomerAuthorisedBusinesses({ personId, crn }, summary)
  },

  /**
   * @param {CustomerParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
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
  /**
   * @param {CustomerBusinessParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   */
  async role({ organisationId, crn }, __, { dataSources }) {
    const businessCustomers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    return transformBusinessCustomerToCustomerRole(crn, businessCustomers)
  },

  /**
   * @param {CustomerBusinessParent} parent
   * @param {CustomerBusinessMessagesArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async messages(
    { organisationId, sbi, personId, crn },
    { fromDate },
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordEntity(info, {
      entity: 'message-list',
      action: 'read',
      entityid: `${crn}-${sbi}`
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

  /**
   * @param {CustomerBusinessParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async permissionGroups({ organisationId, sbi, crn }, __, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'permission-list',
      action: 'read',
      entityid: `${crn}-${sbi}`
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
