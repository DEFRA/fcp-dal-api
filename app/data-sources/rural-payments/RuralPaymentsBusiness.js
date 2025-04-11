import { NotFound } from '../../errors/graphql.js'
import { RURAL_PAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsBusiness extends RuralPayments {
  async getOrganisationById(organisationId) {
    this.logger.silly('Getting organisation by ID', { organisationId })

    const organisationResponse = await this.get(`organisation/${organisationId}`)

    if (!organisationResponse?._data?.id) {
      this.logger.warn(
        '#datasource - Rural payments - organisation not found for organisation ID',
        { organisationId, code: RURAL_PAYMENTS_API_NOT_FOUND_001 }
      )
      throw new NotFound('Rural payments organisation not found')
    }

    this.logger.silly('Organisation by ID', { organisationResponse })
    return organisationResponse._data
  }

  async getOrganisationBySBI(sbi) {
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
      this.logger.warn(
        '#datasource - Rural payments - organisation not found for organisation SBI',
        { sbi, code: RURAL_PAYMENTS_API_NOT_FOUND_001 }
      )
      throw new NotFound('Rural payments organisation not found')
    }

    this.logger.silly('Organisation by SBI', { response: { body: organisationResponse } })

    const response = organisationResponse?._data?.pop() || {}

    return response?.id ? this.getOrganisationById(response.id) : null
  }

  async getOrganisationCustomersByOrganisationId(organisationId) {
    this.logger.silly('Getting organisation customers by organisation ID', { organisationId })

    const response = await this.get(`authorisation/organisation/${organisationId}`)
    this.logger.silly('Organisation customers by organisation ID', { response: { body: response } })
    return response._data
  }

  getParcelsByOrganisationId(organisationId) {
    this.logger.silly('Getting organisation parcels by organisation ID', { organisationId })

    return this.get(`lms/organisation/${organisationId}/parcels`)
  }

  getParcelsByOrganisationIdAndDate(organisationId, date) {
    this.logger.silly('Getting organisation parcels by organisation ID and date', {
      organisationId,
      date
    })

    // Convert 'YYYY-MM-DD' to 'DD-MMM-YY, e.g. 19-Jul-20
    const formattedDate = new Date(date)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      })
      .replace(/ /g, '-')

    return this.get(`lms/organisation/${organisationId}/parcels/historic/${formattedDate}`)
  }

  getParcelEffectiveDatesByOrganisationIdAndDate(organisationId, date) {
    this.logger.silly('Getting organisation parcel effective dates by organisation ID and date', {
      organisationId,
      date
    })

    // Convert 'YYYY-MM-DD' to 'DD-MMM-YY, e.g. 19-Jul-20
    const formattedDate = new Date(date)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      })
      .replace(/ /g, '-')

    return this.get(`lms/organisation/${organisationId}/parcel-details/historic/${formattedDate}`)
  }

  getCoversByOrgSheetParcelIdDate(organisationId, sheetId, parcelId, date) {
    this.logger.silly('Getting organisation covers by sheet ID, parcel ID and date', {
      organisationId,
      sheetId,
      parcelId,
      date
    })

    // Convert 'YYYY-MM-DD' to 'DD-MMM-YY, e.g. 19-Jul-20
    const formattedDate = new Date(date)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      })
      .replace(/ /g, '-')

    return this.get(
      `lms/organisation/${organisationId}/parcel/sheet-id/${sheetId}/parcel-id/${parcelId}/historic/${formattedDate}/land-covers`
    )
  }

  getCoversSummaryByOrganisationIdAndDate(organisationId, date) {
    this.logger.silly('Getting organisation covers summary by organisation ID and date', {
      organisationId,
      date
    })

    // Convert 'YYYY-MM-DD' to 'DD-MMM-YY, e.g. 19-Jul-20
    const formattedDate = new Date(date)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      })
      .replace(/ /g, '-')

    return this.get(`lms/organisation/${organisationId}/covers-summary/historic/${formattedDate}`)
  }

  async getOrganisationCPHCollectionByOrganisationId(organisationId) {
    this.logger.silly('Getting organisation CPH collection by organisation ID', { organisationId })

    const response = await this.get(`SitiAgriApi/cph/organisation/${organisationId}/cph-numbers`)

    this.logger.silly('Organisation CPH collection by organisation ID', {
      response: { body: response }
    })
    return response.data
  }

  async getOrganisationCPHInfoByOrganisationIdAndCPHNumber(organisationId, cphNumber) {
    this.logger.silly('Getting organisation CPH info by organisation ID and CPH number', {
      organisationId,
      cphNumber
    })

    const response = await this.get(
      `SitiAgriApi/cph/organisation/${organisationId}/cph-numbers/${encodeURIComponent(cphNumber)}`
    )

    this.logger.silly('Organisation CPH info by organisation ID and CPH number', {
      response: { body: response }
    })

    return response.data
  }
}
