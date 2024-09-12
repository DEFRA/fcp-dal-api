import { logger, sampleResponse } from '../../utils/logger.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsBusiness extends RuralPayments {
  async getOrganisationById (id) {
    logger.debug('Getting organisation by ID', { id })
    try {
      const organisationResponse = await this.get(`organisation/${id}`)

      logger.debug('Organisation by ID', { organisationResponse })
      return organisationResponse._data
    } catch (error) {
      logger.error('Error getting organisation by ID', { id, error })
      throw error
    }
  }

  async getOrganisationBySBI (sbi) {
    logger.debug('Getting organisation by SBI', { sbi })
    const body = JSON.stringify({
      searchFieldType: 'SBI',
      primarySearchPhrase: sbi,
      offset: 0,
      limit: 1
    })

    try {
      const organisationResponse = await this.post('organisation/search', {
        body,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = organisationResponse?._data?.pop() || {}

      logger.debug('Organisation by SBI', { response: sampleResponse(response) })
      return response?.id ? this.getOrganisationById(response.id) : null
    } catch (error) {
      logger.error('Error getting organisation by SBI', {
        sbi,
        error
      })
      throw error
    }
  }

  async getOrganisationCustomersByOrganisationId (organisationId) {
    logger.verbose('Getting organisation customers by organisation ID', {
      organisationId
    })

    try {
      const response = await this.get(
        `authorisation/organisation/${organisationId}`
      )
      logger.debug('Organisation customers by organisation ID', { response: sampleResponse(response) })
      return response._data
    } catch (error) {
      logger.error('Error getting organisation customers by organisation ID', {
        organisationId,
        error
      })
      throw error
    }
  }

  getParcelsByOrganisationId (organisationId) {
    return this.get(`lms/organisation/${organisationId}/parcels`)
  }

  getCoversByOrganisationId (organisationId) {
    return this.get(`lms/organisation/${organisationId}/land-covers`)
  }

  getCoversSummaryByOrganisationIdAndDate (organisationId, historicDate) {
    const formattedHistoricDate = historicDate
      .toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      })
      .replace(/ /g, '-')
    return this.get(
      `lms/organisation/${organisationId}/covers-summary/historic/${formattedHistoricDate}`
    )
  }

  async getOrganisationCPHCollectionByOrganisationId (organisationId) {
    const response = await this.get(
      `SitiAgriApi/cph/organisation/${organisationId}/cph-numbers`
    )
    return response.data
  }

  async getOrganisationCPHInfoByOrganisationIdAndCPHNumber (
    organisationId,
    cphNumber
  ) {
    const response = await this.get(
      `SitiAgriApi/cph/organisation/${organisationId}/cph-numbers/${encodeURIComponent(
        cphNumber
      )}`
    )
    return response.data
  }
}
