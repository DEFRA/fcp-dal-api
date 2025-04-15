import { StatusCodes } from 'http-status-codes'
import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsCustomer extends RuralPayments {
  async getCustomerByCRN(crn) {
    this.logger.silly('Getting customer by CRN', { crn })

    const body = JSON.stringify({
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: crn,
      offset: 0,
      limit: 1
    })

    const customerResponse = await this.post('person/search', {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    this.logger.silly('Customer by CRN response', { response: { body: customerResponse } })

    const response = customerResponse._data.pop() || {}

    if (!response?.id) {
      this.logger.warn(`#datasource - Rural payments - Customer not found for CRN: ${crn}`, {
        crn,
        code: RURALPAYMENTS_API_NOT_FOUND_001,
        response: { body: customerResponse }
      })
      throw new NotFound('Rural payments customer not found')
    }

    return this.getPersonByPersonId(response.id)
  }

  async getPersonByPersonId(personId) {
    this.logger.silly('Getting person by person ID', { personId })

    const response = await this.get(`person/${personId}/summary`)

    if (!response?._data?.id) {
      this.logger.warn('#datasource - Rural payments - Customer not found for Person ID', {
        personId,
        code: RURALPAYMENTS_API_NOT_FOUND_001,
        response: { body: response }
      })
      throw new NotFound('Rural payments customer not found')
    }

    this.logger.silly('Person by person ID response', { response: { body: response } })
    return response._data
  }

  async getPersonBusinessesByPersonId(personId, sbi) {
    this.logger.silly('Getting person businesses by person ID', { personId, sbi })

    const personBusinessSummaries = await this.get(
      // Currently requires and empty search parameter or it returns 500 error
      // page-size param set to ensure all orgs are retrieved
      `organisation/person/${personId}/summary?search=&page-size=${process.env.VERSION_1_PAGE_SIZE || 100}`
    )

    this.logger.silly('Person businesses by person ID response', {
      response: { body: personBusinessSummaries }
    })
    return personBusinessSummaries._data
  }

  async getNotificationsByOrganisationIdAndPersonId(organisationId, personId, dateFrom) {
    this.logger.silly('Getting notifications by organisation ID and person ID', {
      organisationId,
      personId
    })

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

      // Filter notifications based on creation date
      const newNotifications = currentPageNotifications.filter(
        (notification) => notification.createdAt > dateFrom.valueOf()
      )

      // Combine new notifications with existing ones
      const allNotificationsSoFar = [...accumulatedNotifications, ...newNotifications]

      // If not all notifications from this page are included, stop recursion
      if (newNotifications.length < currentPageNotifications.length) {
        return allNotificationsSoFar
      }

      // Otherwise, continue to the next page
      return makeRecursiveRequest(page + 1, allNotificationsSoFar)
    }

    const notifications = await makeRecursiveRequest()

    this.logger.silly('Notifications by organisation ID and person ID response', {
      notifications
    })

    return notifications
  }

  async getAuthenticateAnswersByCRN(crn) {
    this.logger.silly('Getting authenticate answers by crn', { crn })
    const response = await this.get(`external-auth/security-answers/${crn}`)
    if (response.status === StatusCodes.NO_CONTENT) {
      this.logger.silly('#datasource - Rural payments - authenticate answers not found for CRN', {
        crn,
        code: RURALPAYMENTS_API_NOT_FOUND_001
      })
      return null
    }
    return response
  }
}
