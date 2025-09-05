import jwt from 'jsonwebtoken'
import { BadRequest, NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { postPutHeaders } from '../../utils/headers.js'
import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsBusiness extends RuralPayments {
  async createOrganisationByPersonId(personId, orgDetails) {
    const response = await this.post(`organisation/create/${personId}`, {
      body: orgDetails,
      headers: postPutHeaders
    })
    return response._data
  }

  async getOrganisationById(organisationId) {
    const organisationResponse = await this.get(`organisation/${organisationId}`)

    if (!organisationResponse?._data?.id) {
      this.logger.warn(
        '#datasource - Rural payments - organisation not found for organisation ID',
        { organisationId, code: RURALPAYMENTS_API_NOT_FOUND_001 }
      )
      throw new NotFound('Rural payments organisation not found')
    }

    return organisationResponse._data
  }

  async organisationSearchBySbi(sbi) {
    const body = JSON.stringify({
      searchFieldType: 'SBI',
      primarySearchPhrase: sbi,
      offset: 0,
      limit: 1
    })

    const organisationResponse = await this.post('organisation/search', {
      body,
      headers: postPutHeaders
    })

    if (!organisationResponse?._data?.length) {
      this.logger.warn(
        '#datasource - Rural payments - organisation not found for organisation SBI',
        { sbi, code: RURALPAYMENTS_API_NOT_FOUND_001 }
      )
      throw new NotFound('Rural payments organisation not found')
    }

    return organisationResponse._data[0]
  }

  async getOrganisationIdBySBI(sbi) {
    if (this.gatewayType === 'external') {
      return this.extractOrgIdFromDefraIdToken(sbi)
    }
    return (await this.organisationSearchBySbi(sbi)).id
  }

  async getOrganisationBySBI(sbi) {
    const orgId = await this.getOrganisationIdBySBI(sbi)
    return this.getOrganisationById(orgId)
  }

  async getOrganisationCustomersByOrganisationId(organisationId) {
    const response = await this.get(`authorisation/organisation/${organisationId}`)
    return response._data
  }

  getParcelsByOrganisationId(organisationId) {
    return this.get(`lms/organisation/${organisationId}/parcels`)
  }

  getParcelsByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = this.formatDateDDMMMYY(new Date(date))

    return this.get(`lms/organisation/${organisationId}/parcels/historic/${formattedDate}`)
  }

  getParcelEffectiveDatesByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = this.formatDateDDMMMYY(new Date(date))

    return this.get(`lms/organisation/${organisationId}/parcel-details/historic/${formattedDate}`)
  }

  getCoversByOrgSheetParcelIdDate(organisationId, sheetId, parcelId, date) {
    const formattedDate = this.formatDateDDMMMYY(new Date(date))

    return this.get(
      `lms/organisation/${organisationId}/parcel/sheet-id/${sheetId}/parcel-id/${parcelId}/historic/${formattedDate}/land-covers`
    )
  }

  getCoversSummaryByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = this.formatDateDDMMMYY(new Date(date))

    return this.get(`lms/organisation/${organisationId}/covers-summary/historic/${formattedDate}`)
  }

  async getCountyParishHoldingsBySBI(sbi) {
    const response = await this.get(`SitiAgriApi/cv/cphByBusiness/sbi/${sbi}/list`, {
      params: {
        // pointInTime: current date/time formatted as `YYYY-MM-DD hh:mm:ss`
        pointInTime: new Date()
          .toLocaleString('en-GB', {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
          .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/, '$3-$2-$1 $4')
      }
    })
    return response.data
  }

  async updateOrganisationDetails(organisationId, orgDetails) {
    const response = this.put(`organisation/${organisationId}/business-details`, {
      body: orgDetails,
      headers: postPutHeaders
    })

    return response
  }

  async getAgreementsBySBI(sbi) {
    const response = await this.get(`SitiAgriApi/cv/agreementsByBusiness/sbi/${sbi}/list`)
    return response.data
  }

  async getApplicationsBySBI(sbi) {
    const response = await this.get(`SitiAgriApi/cv/appByBusiness/sbi/${sbi}/list`)
    return response.data
  }

  async updateOrganisationAdditionalDetails(organisationId, orgAdditionalDetails) {
    const response = this.put(`organisation/${organisationId}/additional-business-details`, {
      body: orgAdditionalDetails,
      headers: postPutHeaders
    })

    return response
  }

  formatDateDDMMMYY(date) {
    // Convert date to 'DD-MMM-YY, e.g. 19-Jul-20
    const day = date.toLocaleString('en-US', { day: '2-digit' }) // 01
    const month = date.toLocaleString('en-US', { month: 'short' }) // "Sep"
    const year = date.toLocaleString('en-US', { year: '2-digit' }) // "25"
    return `${day}-${month}-${year}`
  }

  extractOrgIdFromDefraIdToken(sbi) {
    const token = this.request.headers['x-forwarded-authorization']
    const { payload } = jwt.decode(token, { complete: true })
    if (payload?.relationships && Array.isArray(payload.relationships)) {
      // Find relationship string that matches the given SBI
      const relationship = payload.relationships.find((rel) => {
        const [, tokenSBI] = rel.split(':')
        return sbi === tokenSBI
      })
      if (relationship) {
        const [orgId] = relationship.split(':')
        return orgId
      }
    }
    throw new BadRequest('Defra ID token is not valid for the provided SBI')
  }
}
