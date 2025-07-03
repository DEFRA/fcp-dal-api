import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import {
  hasUndefinedFieldsInOrgDetailsUpdate,
  transformBusinessDetailsToOrgDetailsUpdate
} from '../../transformers/rural-payments/business.js'
import { RuralPayments } from './RuralPayments.js'
export class RuralPaymentsBusiness extends RuralPayments {
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

  async getOrganisationIdBySBI(sbi) {
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
        { sbi, code: RURALPAYMENTS_API_NOT_FOUND_001 }
      )
      throw new NotFound('Rural payments organisation not found')
    }

    const response = organisationResponse?._data?.pop() || {}

    return response?.id || null
  }

  async getOrganisationBySBI(sbi) {
    const orgId = await this.getOrganisationIdBySBI(sbi)
    return orgId ? this.getOrganisationById(orgId) : null
  }

  async getOrganisationCustomersByOrganisationId(organisationId) {
    const response = await this.get(`authorisation/organisation/${organisationId}`)
    return response._data
  }

  getParcelsByOrganisationId(organisationId) {
    return this.get(`lms/organisation/${organisationId}/parcels`)
  }

  getParcelsByOrganisationIdAndDate(organisationId, date) {
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

  async getCountyParishHoldingsBySBI(sbi) {
    const response = await this.get(`SitiAgriApi/cv/cphByBusiness/sbi/${sbi}/list`)
    return response.data
  }

  async updateOrganisationDetails(organisationId, businessDetails) {
    // Only retrieve org details when all fields are not provided.
    let orgDetails
    if (hasUndefinedFieldsInOrgDetailsUpdate(businessDetails)) {
      const currentOrgDetails = await this.getOrganisationById(organisationId)
      orgDetails = { ...currentOrgDetails, ...businessDetails }
    } else {
      orgDetails = businessDetails
    }
    const body = transformBusinessDetailsToOrgDetailsUpdate(orgDetails)

    const response = this.put(`organisation/${organisationId}/business-details`, {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return response
  }

  async getAgreementsBySBI(sbi) {
    const response = await this.get(`SitiAgriApi/cv/agreementsByBusiness/sbi/${sbi}/list`)
    return response.data
  }

  async updateBusinessDetailsBySBI(sbi, businessDetails) {
    const orgId = await this.getOrganisationIdBySBI(sbi)
    return this.updateOrganisationDetails(orgId, businessDetails)
  }
}
