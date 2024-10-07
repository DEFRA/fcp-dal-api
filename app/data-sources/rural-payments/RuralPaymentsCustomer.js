import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { sampleResponse } from '../../logger/utils.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsCustomer extends RuralPayments {
  async getCustomerByCRN (crn) {
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
    const response = customerResponse._data.pop() || {}
    this.logger.silly('Customer by CRN response', { response: sampleResponse(response) })

    if (!response?.id) {
      this.logger.warn('#datasource - Rural payments - Customer not found for CRN', { crn, code: RURALPAYMENTS_API_NOT_FOUND_001 })
      throw new NotFound('Rural payments customer not found')
    }

    return this.getPersonByPersonId(response.id)
  }

  async getPersonByPersonId (personId) {
    this.logger.silly('Getting person by person ID', { personId })

    const response = await this.get(`person/${personId}/summary`)

    if (!response?._data?.id) {
      this.logger.warn('#datasource - Rural payments - Customer not found for Person ID', { personId, code: RURALPAYMENTS_API_NOT_FOUND_001 })
      throw new NotFound('Rural payments customer not found')
    }

    this.logger.silly('Person by person ID response', { response: sampleResponse(response) })
    return response._data
  }

  async getPersonBusinessesByPersonId (personId, sbi) {
    this.logger.silly('Getting person businesses by person ID', { personId, sbi })

    const personBusinessSummaries = await this.get(
      // Currently requires and empty search parameter or it returns 500 error
      // page-size param set to ensure all orgs are retrieved
      `organisation/person/${personId}/summary?search=&page-size=${process.env.VERSION_1_PAGE_SIZE || 100}`
    )

    this.logger.silly('Person businesses by person ID response', { response: sampleResponse(personBusinessSummaries) })
    return personBusinessSummaries._data
  }

  async getNotificationsByOrganisationIdAndPersonId (
    organisationId,
    personId,
    page,
    size
  ) {
    this.logger.silly('Getting notifications by organisation ID and person ID', {
      organisationId,
      personId,
      page,
      size
    })

    const response = await this.get('notifications', {
      params: {
        personId,
        organisationId,
        filter: '',
        page,
        size
      }
    })

    this.logger.silly('Notifications by organisation ID and person ID response', {
      response
    })

    return response.notifications
  }
}
