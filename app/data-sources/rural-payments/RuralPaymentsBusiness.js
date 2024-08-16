import { logger } from '../../utils/logger.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsBusiness extends RuralPayments {
  async getOrganisationById (id) {
    logger.debug('Getting organisation by ID', { id })
    const organisationResponse = await this.get(`organisation/${id}`)

    logger.debug('Organisation by ID', { organisationResponse })
    return organisationResponse._data
  }

  async getOrganisationBySBI (sbi) {
    logger.debug('Getting organisation by SBI', { sbi })
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

    const response = organisationResponse?._data?.pop() || {}

    logger.debug('Organisation by SBI', { response })
    return this.getOrganisationById(response.id)
  }

  async getOrganisationCustomersByOrganisationId (organisationId) {
    logger.debug('Getting organisation customers by organisation ID', {
      organisationId
    })
    const response = await this.get(
      `authorisation/organisation/${organisationId}`
    )

    logger.debug('Organisation customers by organisation ID', { response })
    return response._data
  }

  // Required for role
  async getAuthorisationByOrganisationId (organisationId) {
    logger.debug('Getting authorisation by organisation ID', { organisationId })
    const response = await this.get(
      `authorisation/organisation/${organisationId}`
    )

    logger.debug('Authorisation by organisation ID', { response })
    return response._data
  }

  getParcelsByOrganisationId (organisationId) {
    return this.get(`lms/organisation/${organisationId}/parcels`)
  }

  getCoversByOrganisationId (organisationId) {
    return this.get(`lms/organisation/${organisationId}/land-covers`)
  }

  getCoversSummaryByOrganisationId (organisationId) {
    return this.get(`lms/organisation/${organisationId}/covers-summary`)
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
