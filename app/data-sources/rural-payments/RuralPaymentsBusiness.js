import { StatusCodes } from 'http-status-codes'
import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { formatDateAsUtcDateTime } from '../../utils/date.js'
import { postPutHeaders } from '../../utils/headers.js'
import { getSearchOffsetAndLimit } from '../../utils/pagination.js'
import { RuralPayments, SELF_SERVICE_PORTAL_MODULE } from './RuralPayments.js'

/**
 * Formats a `Date` as `DD-MMM-YY` (e.g. `19-Jul-20`), the date format the LMS historic endpoints
 * expect in their URL path.
 *
 * The day, month and year are taken in the server's local timezone, not UTC, so a date near
 * midnight UTC can format as the previous or next day on a server outside GMT.
 *
 * @param {Date} date - The date to format; must be a valid `Date`.
 * @returns {string} The formatted date, e.g. `19-Jul-20`. An invalid `Date` gives
 *   `Invalid Date-Invalid Date-Invalid Date`.
 */
export const formatDateDDMMMYY = (date) => {
  const day = date.toLocaleString('en-US', { day: '2-digit' }) // 01
  const month = date.toLocaleString('en-US', { month: 'short' }) // "Sep"
  const year = date.toLocaleString('en-US', { year: '2-digit' }) // "25"
  return `${day}-${month}-${year}`
}

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
        `#datasource - Rural payments - organisation not found for organisation ID: ${organisationId}`,
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

  async organisationSearch(searchFieldType, primarySearchPhrase, pagination) {
    const { offset, limit } = getSearchOffsetAndLimit(pagination)

    const body = JSON.stringify({
      searchFieldType,
      primarySearchPhrase,
      offset,
      limit
    })

    const response = await this.post('organisation/search', {
      body,
      headers: postPutHeaders
    })

    return {
      data: response?._data ?? [],
      page: response?._page
    }
  }

  async getOrganisationIdBySBI(sbi) {
    if (this.isExternalRoute()) {
      return this.defraIdContext.orgId(sbi)
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

  /**
   * Gets an organisation's land parcels as they were on a given date, from LMS.
   *
   * Used for the parcel list and for the land summary's total parcels and total area.
   *
   * @param {string|number} organisationId - Rural payments organisation ID.
   * @param {Date} date - The point in time to get parcels for; sent as `DD-MMM-YY` (see
   *   {@link formatDateDDMMMYY}).
   * @returns {Promise<object[]>} The raw LMS parcels; see `transformLandParcels`,
   *   `transformTotalParcels` and `transformTotalArea`.
   */
  getParcelsByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(date)

    return this.get(`lms/organisation/${organisationId}/parcels/historic/${formattedDate}`)
  }

  /**
   * Gets the effective from/to dates of an organisation's land parcels as they were on a given
   * date, from LMS.
   *
   * @param {string|number} organisationId - Rural payments organisation ID.
   * @param {Date} date - The point in time to get parcel details for; sent as `DD-MMM-YY` (see
   *   {@link formatDateDDMMMYY}).
   * @returns {Promise<object[]>} The raw LMS parcel details; see
   *   `transformLandParcelsEffectiveDates`.
   */
  getParcelEffectiveDatesByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(date)

    return this.get(`lms/organisation/${organisationId}/parcel-details/historic/${formattedDate}`)
  }

  /**
   * Gets the land covers of a single parcel as they were on a given date, from LMS.
   *
   * @param {string|number} organisationId - Rural payments organisation ID.
   * @param {string} sheetId - The parcel's OS sheet ID.
   * @param {string} parcelId - The parcel ID within the sheet.
   * @param {Date} date - The point in time to get land covers for; sent as `DD-MMM-YY` (see
   *   {@link formatDateDDMMMYY}).
   * @returns {Promise<object>} The raw LMS land covers, as a GeoJSON-style feature collection
   *   (`{ features: [...] }`); see `transformLandCovers`.
   */
  getCoversByOrgSheetParcelIdDate(organisationId, sheetId, parcelId, date) {
    const formattedDate = formatDateDDMMMYY(date)

    return this.get(
      `lms/organisation/${organisationId}/parcel/sheet-id/${sheetId}/parcel-id/${parcelId}/historic/${formattedDate}/land-covers`
    )
  }

  /**
   * Gets a summary of an organisation's land covers (area by cover type) as they were on a given
   * date, from LMS.
   *
   * Used for the land summary's arable land, permanent grassland and permanent crops areas.
   *
   * @param {string|number} organisationId - Rural payments organisation ID.
   * @param {Date} date - The point in time to get the summary for; sent as `DD-MMM-YY` (see
   *   {@link formatDateDDMMMYY}).
   * @returns {Promise<object[]>} The raw LMS covers summary; see `transformLandCoversToArea`.
   */
  getCoversSummaryByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(date)

    return this.get(`lms/organisation/${organisationId}/covers-summary/historic/${formattedDate}`)
  }

  async getCountyParishHoldingsBySBI(sbi) {
    const response = await this.get(`SitiAgriApi/cv/cphByBusiness/sbi/${sbi}/list`, {
      params: {
        pointInTime: formatDateAsUtcDateTime(new Date())
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

  async lockOrganisation(organisationId, body) {
    try {
      const response = await this.post(`organisation/${organisationId}/lock`, {
        body: {
          partyNoteType: 'LockOrganisation',
          ...body
        },
        headers: postPutHeaders
      })

      return response
    } catch (error) {
      if (error?.extensions?.http?.status === StatusCodes.INTERNAL_SERVER_ERROR) {
        const organisation = await this.getOrganisationById(organisationId)
        if (organisation.locked) {
          throw new Error('Business is already locked')
        }
      }
      throw error
    }
  }

  async unlockOrganisation(organisationId, body) {
    try {
      const response = await this.post(`organisation/${organisationId}/unlock`, {
        body: {
          partyNoteType: 'UnlockOrganisation',
          ...body
        },
        headers: postPutHeaders
      })

      return response
    } catch (error) {
      if (error?.extensions?.http?.status === StatusCodes.INTERNAL_SERVER_ERROR) {
        const organisation = await this.getOrganisationById(organisationId)
        if (!organisation.locked) {
          throw new Error('Business is already unlocked')
        }
      }
      throw error
    }
  }

  async reactivateOrganisation(organisationId, body) {
    try {
      const response = await this.post(`organisation/${organisationId}/reactivate`, {
        body: {
          partyNoteType: 'ReactivateOrganisation',
          ...body
        },
        headers: postPutHeaders
      })

      return response
    } catch (error) {
      if (error?.extensions?.http?.status === StatusCodes.INTERNAL_SERVER_ERROR) {
        const organisation = await this.getOrganisationById(organisationId)
        if (!organisation.deactivated) {
          throw new Error('Business is not deactivated')
        }
      }
      throw error
    }
  }

  async deactivateOrganisation(organisationId, body) {
    try {
      const response = await this.post(`organisation/${organisationId}/deactivate`, {
        body: {
          partyNoteType: 'DeactivateOrganisation',
          ...body
        },
        headers: postPutHeaders
      })

      return response
    } catch (error) {
      if (error?.extensions?.http?.status === StatusCodes.INTERNAL_SERVER_ERROR) {
        const organisation = await this.getOrganisationById(organisationId)
        if (!organisation.locked) {
          throw new Error(
            'Business deactivation failed. Business status is not in lock state or business does not exist'
          )
        }
      }
      throw error
    }
  }

  async submitBankChange(submission) {
    return this.post('bank-change-service/v1/submit', {
      body: submission,
      headers: postPutHeaders
    })
  }

  async validateBankChange(submission) {
    return this.post('bank-change-service/v1/validate', {
      body: submission,
      headers: postPutHeaders
    })
  }

  async getBankChangeLockedStatus(organisationId, personId) {
    return this.get(`bank-change-service/v1/locked-status/${organisationId}/${personId}`)
  }

  async getBankChangeAccountStatus(organisationId) {
    return this.get(`bank-change-service/v1/account-status/${organisationId}`)
  }

  async getExistingBankAccounts(frn) {
    return this.get(`bank-change-service/v1/existing-accounts/${frn}`)
  }

  async getAuthorisedFunctionsByOrganisationId(organisationId, functions) {
    const query = new URLSearchParams({
      functions: functions.join('|'),
      module: SELF_SERVICE_PORTAL_MODULE,
      timestamp: Date.now()
    })
    const response = await this.get(
      `SitiAgriApi/authorisation/organisation/${organisationId}/byFunction?${query}`
    )
    return response.data
  }

  /**
   * Gets the land uses of a single parcel for a business as they were at a given point in time,
   * from SitiAgri.
   *
   * @param {string|number} sbi - The business's SBI.
   * @param {string} sheetId - The parcel's OS sheet ID.
   * @param {string} parcelId - The parcel ID within the sheet.
   * @param {Date} [date=new Date()] - The point in time to get land uses for; sent as
   *   `YYYY-MM-DD hh:mm:ss` in UTC (see `formatDateAsUtcDateTime`). Defaults to now.
   * @returns {Promise<object[]>} The raw land uses (the response's `data`); see
   *   `transformLandUses`.
   */
  async getLandUseByBusinessParcel(sbi, sheetId, parcelId, date = new Date()) {
    const response = await this.get(
      `SitiAgriApi/cv/landUseByBusinessParcel/sheet/${sheetId}/parcel/${parcelId}/sbi/${sbi}/list`,
      {
        params: {
          pointInTime: formatDateAsUtcDateTime(date)
        }
      }
    )
    return response.data
  }

  async createAuthorisationForOrganisation(organisationId, body) {
    return this.post(`SitiAgriApi/authorisation/organisation/${organisationId}/authorisation`, {
      body,
      headers: postPutHeaders
    })
  }

  async updateAuthorisationForPersonOnOrganisation(organisationId, personId, body) {
    return this.put(
      `SitiAgriApi/authorisation/organisation/${organisationId}/authorisation/person/${personId}`,
      {
        body,
        headers: postPutHeaders
      }
    )
  }
}
