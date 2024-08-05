import logger from '../../utils/logger.js'
import { VersionOne } from './version-one.js'

export class VersionOneCustomer extends VersionOne {
  async getCustomerByCRN (crn) {
    logger.debug('Getting customer by CRN', { crn })

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

    logger.debug('Customer by CRN', { response })
    return this.getPersonByPersonId(response.id)
  }

  async getPersonByPersonId (personId) {
    logger.debug('Getting person by person ID', { personId })
    const response = await this.get(`person/${personId}/summary`)

    logger.debug('Person by person ID', { response })
    return response._data
  }

  async getPersonBusinessesByPersonId (personId, sbi) {
    logger.debug('Getting person businesses by person ID', { personId, sbi })
    const personBusinessSummaries = await this.get(
      `organisation/person/${personId}/summary`
    )

    logger.debug('Person businesses by person ID', { personBusinessSummaries })
    return personBusinessSummaries._data
  }
}
