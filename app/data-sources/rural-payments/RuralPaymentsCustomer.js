import { NotFound } from '../../errors/graphql.js'
import { logger, sampleResponse } from '../../utils/logger.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsCustomer extends RuralPayments {
  async getCustomerByCRN (crn) {
    logger.debug('Getting customer by CRN', { crn })

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
      logger.debug('Customer by CRN', { response: sampleResponse(response) })

      if (!response?.id) {
        logger.info(`Customer not found for CRN: ${crn}`)
        throw new NotFound('Customer not found')
      }

      return this.getPersonByPersonId(response.id)
    } catch (error) {
      logger.error('Error getting customer by CRN', { crn, error })
      throw error
    }
  }

  async getPersonByPersonId (personId) {
    logger.debug('Getting person by person ID', { personId })
    try {
      const response = await this.get(`person/${personId}/summary`)

      logger.debug('Person by person ID', { response: sampleResponse(response) })
      return response._data
    } catch (error) {
      logger.error('Error getting person by person ID', { personId, error })
      throw error
    }
  }

  async getPersonBusinessesByPersonId (personId, sbi) {
    logger.debug('Getting person businesses by person ID', { personId, sbi })

    try {
      const personBusinessSummaries = await this.get(
        // Currently requires and empty search parameter or it returns 500 error
        // page-size param set to ensure all orgs are retrieved
        `organisation/person/${personId}/summary?search=&page-size=${process.env.VERSION_1_PAGE_SIZE}`
      )

      logger.debug('Person businesses by person ID', { personBusinessSummaries })
      return personBusinessSummaries._data
    } catch (error) {
      logger.error('Error getting person businesses by person ID', {
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
    logger.debug('Getting notifications by organisation ID and person ID', {
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
      logger.debug('Notifications by organisation ID and person ID', {
        response
      })

      return response.notifications
    } catch (error) {
      logger.error('Error getting notifications by organisation ID and person ID', {
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
