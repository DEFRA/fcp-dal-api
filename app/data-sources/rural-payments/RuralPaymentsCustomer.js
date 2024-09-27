import { NotFound } from '../../errors/graphql.js'
import { sampleResponse } from '../../logger/utils.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsCustomer extends RuralPayments {
  async getCustomerByCRN (crn) {
    this.logger.verbose('Getting customer by CRN', { crn })

    try {
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
      this.logger.debug('Customer by CRN', { response: sampleResponse(response) })

      if (!response?.id) {
        throw new NotFound('Customer not found')
      }

      return this.getPersonByPersonId(response.id)
    } catch (error) {
      if (error instanceof NotFound) {
        this.logger.warn('Customer not found for CRN', { crn, error })
      } else {
        this.logger.error('Error getting customer by CRN', { crn, error })
      }
      throw error
    }
  }

  async getPersonByPersonId (personId) {
    this.logger.verbose('Getting person by person ID', { personId })
    try {
      const response = await this.get(`person/${personId}/summary`)

      this.logger.debug('Person by person ID', { response: sampleResponse(response) })
      return response._data
    } catch (error) {
      this.logger.error('Error getting person by person ID', { personId, error })
      throw error
    }
  }

  async getPersonBusinessesByPersonId (personId, sbi) {
    this.logger.verbose('Getting person businesses by person ID', { personId, sbi })

    try {
      const personBusinessSummaries = await this.get(
        // Currently requires and empty search parameter or it returns 500 error
        // page-size param set to ensure all orgs are retrieved
        `organisation/person/${personId}/summary?search=&page-size=${process.env.VERSION_1_PAGE_SIZE || 100}`
      )

      this.logger.debug('Person businesses by person ID', { response: sampleResponse(personBusinessSummaries) })
      return personBusinessSummaries._data
    } catch (error) {
      this.logger.error('Error getting person businesses by person ID', {
        personId,
        sbi,
        error
      })
      throw error
    }
  }

  async getNotificationsByOrganisationIdAndPersonId (
    organisationId,
    personId,
    page,
    size
  ) {
    this.logger.verbose('Getting notifications by organisation ID and person ID', {
      organisationId,
      personId,
      page,
      size
    })
    try {
      const response = await this.get('notifications', {
        params: {
          personId,
          organisationId,
          filter: '',
          page,
          size
        }
      })
      this.logger.verbose('Notifications by organisation ID and person ID', {
        response
      })

      return response.notifications
    } catch (error) {
      this.logger.error('Error getting notifications by organisation ID and person ID', {
        organisationId,
        personId,
        page,
        size,
        error
      })
      throw error
    }
  }
}
