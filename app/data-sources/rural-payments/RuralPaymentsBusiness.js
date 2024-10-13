import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsBusiness extends RuralPayments {
  async getOrganisationById (organisationId) {
    this.logger.silly('Getting organisation by ID', { organisationId })

    const organisationResponse = await this.get(`organisation/${organisationId}`)

    if (!organisationResponse?._data?.id) {
      this.logger.warn('#datasource - Rural payments - organisation not found for organisation ID', { organisationId, code: RURALPAYMENTS_API_NOT_FOUND_001 })
      throw new NotFound('Rural payments organisation not found')
    }

    this.logger.silly('Organisation by ID', { organisationResponse })
    return organisationResponse._data
  }

  async getOrganisationBySBI (sbi) {
    this.logger.silly('Getting organisation by SBI', { sbi })
    const body = JSON.stringify({
      searchFieldType: 'SBI',
      primarySearchPhrase: sbi,
      offset: 0,
      limit: 1
    })

    const organisationResponse = await this.post('organisation/search', {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!organisationResponse?._data?.length) {
      this.logger.warn('#datasource - Rural payments - organisation not found for organisation SBI', { sbi, code: RURALPAYMENTS_API_NOT_FOUND_001 })
      throw new NotFound('Rural payments organisation not found')
    }

    this.logger.silly('Organisation by SBI', { response: { body: organisationResponse } })

    const response = organisationResponse?._data?.pop() || {}

    return response?.id ? this.getOrganisationById(response.id) : null
  }

  async getOrganisationCustomersByOrganisationId (organisationId) {
    this.logger.silly('Getting organisation customers by organisation ID', { organisationId })

    const response = await this.get(
        `authorisation/organisation/${organisationId}`
    )
    this.logger.silly('Organisation customers by organisation ID', { response: { body: response } })
    return response._data
  }

  getParcelsByOrganisationId (organisationId) {
    this.logger.silly('Getting organisation parcels by organisation ID', { organisationId })

    return this.get(`lms/organisation/${organisationId}/parcels`)
  }

  getCoversByOrganisationId (organisationId) {
    this.logger.silly('Getting organisation covers by organisation ID', { organisationId })

    return this.get(`lms/organisation/${organisationId}/land-covers`)
  }

  getCoversSummaryByOrganisationIdAndDate (organisationId, historicDate) {
    this.logger.silly('Getting organisation covers summary by organisation ID and date', { organisationId, historicDate })

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
    this.logger.silly('Getting organisation CPH collection by organisation ID', { organisationId })

    const response = await this.get(
      `SitiAgriApi/cph/organisation/${organisationId}/cph-numbers`
    )

    this.logger.silly('Organisation CPH collection by organisation ID', { response: { body: response } })
    return response.data
  }

  async getOrganisationCPHInfoByOrganisationIdAndCPHNumber (
    organisationId,
    cphNumber
  ) {
    this.logger.silly('Getting organisation CPH info by organisation ID and CPH number', { organisationId, cphNumber })

    const response = await this.get(
      `SitiAgriApi/cph/organisation/${organisationId}/cph-numbers/${encodeURIComponent(
        cphNumber
      )}`
    )

    this.logger.silly('Organisation CPH info by organisation ID and CPH number', { response: { body: response } })

    return response.data
  }
}
