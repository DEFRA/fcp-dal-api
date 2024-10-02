import { RURALPAYMENTS_API_ERROR_001 } from '../../logger/codes.js'
import { sampleResponse } from '../../logger/utils.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsBusiness extends RuralPayments {
  async getOrganisationById (organisationId) {
    this.logger.silly('Getting organisation by ID', { organisationId })
    try {
      const organisationResponse = await this.get(`organisation/${organisationId}`)

      this.logger.silly('Organisation by ID', { organisationResponse })
      return organisationResponse._data
    } catch (error) {
      this.logger.error('#datasource - roral payments - Error getting organisation by ID', { organisationId, error, code: RURALPAYMENTS_API_ERROR_001 })
      throw error
    }
  }

  async getOrganisationBySBI (sbi) {
    this.logger.silly('Getting organisation by SBI', { sbi })
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

      this.logger.silly('Organisation by SBI', { response: sampleResponse(response) })
      return response?.id ? this.getOrganisationById(response.id) : null
    } catch (error) {
      this.logger.error('#datasource - roral payments - Error getting organisation by SBI', {
        sbi,
        error,
        code: RURALPAYMENTS_API_ERROR_001
      })
      throw error
    }
  }

  async getOrganisationCustomersByOrganisationId (organisationId) {
    this.logger.silly('Getting organisation customers by organisation ID', {
      organisationId
    })

    try {
      const response = await this.get(
        `authorisation/organisation/${organisationId}`
      )
      this.logger.silly('Organisation customers by organisation ID', { response: sampleResponse(response) })
      return response._data
    } catch (error) {
      this.logger.error('#datasource - roral payments - Error getting organisation customers by organisation ID', {
        organisationId,
        error,
        code: RURALPAYMENTS_API_ERROR_001
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
