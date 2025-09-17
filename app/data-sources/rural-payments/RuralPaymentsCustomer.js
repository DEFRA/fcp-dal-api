import { StatusCodes } from 'http-status-codes'
import { config } from '../../config.js'
import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { postPutHeaders } from '../../utils/headers.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsCustomer extends RuralPayments {
  async getPersonIdByCRN(crn) {
    if (this.gatewayType === 'external') {
      const response = await this.getExternalPerson()
      return response?.id
    }
    return (await this.personSearchByCRN(crn)).id
  }

  async personSearchByCRN(crn) {
    const body = JSON.stringify({
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: crn,
      offset: 0,
      limit: 1
    })

    const customerResponse = await this.post('person/search', {
      body,
      headers: postPutHeaders
    })

    if (!customerResponse?._data?.length) {
      this.logger.warn(`#datasource - Rural payments - Customer not found for CRN: ${crn}`, {
        crn,
        code: RURALPAYMENTS_API_NOT_FOUND_001,
        response: { body: customerResponse }
      })
      throw new NotFound('Rural payments customer not found')
    }
    return customerResponse._data[0]
  }

  async getCustomerByCRN(crn) {
    const personId = await this.getPersonIdByCRN(crn)
    return this.getPersonByPersonId(personId)
  }

  async getExternalPerson() {
    // This personId will will return details for the CRN provided for external users.
    return this.getPersonByPersonId(config.get('kits.external.personIdOverride'))
  }

  async getPersonByPersonId(personId) {
    if (this.gatewayType === 'external') {
      personId = config.get('kits.external.personIdOverride')
    }
    const response = await this.get(`person/${personId}/summary`)
    if (!response?._data?.id) {
      this.logger.warn('#datasource - Rural payments - Customer not found for Person ID', {
        personId,
        code: RURALPAYMENTS_API_NOT_FOUND_001,
        response: { body: response }
      })
      throw new NotFound('Rural payments customer not found')
    }

    return response._data
  }

  async getPersonBusinessesByPersonId(personId) {
    const personBusinessSummaries = await this.get(
      // Currently requires and empty search parameter or it returns 500 error
      // page-size param set to ensure all orgs are retrieved
      `organisation/person/${personId}/summary?search=&page-size=${config.get('kits.requestPageSize')}`
    )

    return personBusinessSummaries._data
  }

  async getNotificationsByOrganisationIdAndPersonId(organisationId, personId, dateFrom) {
    const makeRecursiveRequest = async (page = 1, accumulatedNotifications = []) => {
      // Fetch notifications for the given page
      const response = await this.get('notifications', {
        params: { personId, organisationId, page }
      })

      const currentPageNotifications = response?.notifications ?? []

      // If no notifications are returned, return accumulated notifications
      if (currentPageNotifications.length === 0) {
        return accumulatedNotifications
      }

      // Filter notifications based on creation date if dateFrom is provided
      const newNotifications = dateFrom
        ? currentPageNotifications.filter(
            (notification) => notification.createdAt > dateFrom.valueOf()
          )
        : currentPageNotifications

      // Combine new notifications with existing ones
      const allNotificationsSoFar = [...accumulatedNotifications, ...newNotifications]

      // If dateFrom is provided and not all notifications from this page are included, stop recursion
      if (dateFrom && newNotifications.length < currentPageNotifications.length) {
        return allNotificationsSoFar
      }

      // Otherwise, continue to the next page
      return makeRecursiveRequest(page + 1, allNotificationsSoFar)
    }

    const notifications = await makeRecursiveRequest()

    return notifications
  }

  async getAuthenticateAnswersByCRN(crn) {
    const response = await this.get(`external-auth/security-answers/${crn}`)
    if (response.status === StatusCodes.NO_CONTENT) {
      return null
    }
    return response
  }

  updatePersonDetails(personId, personDetails) {
    return this.put(`person/${personId}`, {
      body: personDetails,
      headers: postPutHeaders
    })
  }
}
