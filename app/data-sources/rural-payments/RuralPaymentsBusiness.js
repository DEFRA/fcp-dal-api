import { StatusCodes } from 'http-status-codes'
import { NotFound } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../logger/codes.js'
import { formatDateAsUtcDateTime } from '../../utils/date.js'
import { parseFeatureCollectionWithRawCoordinates } from '../../utils/feature-collection.js'
import { postPutHeaders } from '../../utils/headers.js'
import { getSearchOffsetAndLimit } from '../../utils/pagination.js'
import { RuralPayments, SELF_SERVICE_PORTAL_MODULE } from './RuralPayments.js'

export const formatDateDDMMMYY = (date) => {
  // Convert date to 'DD-MMM-YY, e.g. 19-Jul-20
  const day = date.toLocaleString('en-US', { day: '2-digit' }) // 01
  const month = date.toLocaleString('en-US', { month: 'short' }) // "Sep"
  const year = date.toLocaleString('en-US', { year: '2-digit' }) // "25"
  return `${day}-${month}-${year}`
}

export const parcelGeometryKey = (sheetId, parcelId) => `${sheetId}:${parcelId}`

const ORGANISATION_GEOMETRIES_PATH = /\/lms\/organisation\/[^/]+\/geometries(\?|$)/
const isOrganisationGeometriesUrl = (url) => ORGANISATION_GEOMETRIES_PATH.test(String(url))

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

  getParcelsByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(new Date(date))

    return this.get(`lms/organisation/${organisationId}/parcels/historic/${formattedDate}`)
  }

  getParcelEffectiveDatesByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(new Date(date))

    return this.get(`lms/organisation/${organisationId}/parcel-details/historic/${formattedDate}`)
  }

  getCoversByOrgSheetParcelIdDate(organisationId, sheetId, parcelId, date, includeGeometries) {
    const formattedDate = formatDateDDMMMYY(new Date(date))
    const path = `lms/organisation/${organisationId}/parcel/sheet-id/${sheetId}/parcel-id/${parcelId}/historic/${formattedDate}/land-covers`

    return includeGeometries
      ? this.get(path, { params: { includeGeometries: 'true' } })
      : this.get(path)
  }

  getCoversSummaryByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(new Date(date))

    return this.get(`lms/organisation/${organisationId}/covers-summary/historic/${formattedDate}`)
  }

  // Organisation geometries responses are very large (~50MB of GeoJSON for 23k parcels).  With
  // RESTDataSource's request deduplication, every response - even to the first caller - is passed
  // through lodash cloneDeep, briefly doubling the memory and CPU spent on it.  Geometries are not
  // deduplicated by RESTDataSource; instead the response promise is cached below, per
  // organisation and date, for the lifetime of the (per GraphQL request) data source.
  requestDeduplicationPolicyFor(url, request) {
    if (isOrganisationGeometriesUrl(url)) {
      return { policy: 'do-not-deduplicate' }
    }
    return super.requestDeduplicationPolicyFor(url, request)
  }

  // Successful organisation geometries responses are read as text, so that the coordinates can be
  // kept as raw JSON text rather than parsed (see getParcelGeometriesByOrganisationIdAndDate)
  parseBody(response) {
    if (response.ok && isOrganisationGeometriesUrl(response.url)) {
      return response.text()
    }
    return super.parseBody(response)
  }

  // Cache key for an organisation and the day upstream is asked for, so that different values for
  // the same day (e.g. separate `new Date()` defaults) share one request.  The parcel geometry
  // lookup is called once per parcel, and formatDateDDMMMYY's toLocaleString calls cost ~80µs each
  // (~1.8s for 23k parcels), so the formatted day is memoised per date value - every parcel in a
  // request carries the same date value.
  #geometriesCacheKey(organisationId, date) {
    this.formattedGeometryDates ??= new Map()
    if (!this.formattedGeometryDates.has(date)) {
      this.formattedGeometryDates.set(date, formatDateDDMMMYY(new Date(date)))
    }
    return `${organisationId}:${this.formattedGeometryDates.get(date)}`
  }

  getParcelGeometriesByOrganisationIdAndDate(organisationId, date) {
    this.parcelGeometries ??= new Map()
    const key = this.#geometriesCacheKey(organisationId, date)
    if (!this.parcelGeometries.has(key)) {
      // A bbox of 0,0,0,0 tells upstream to return all geometries for the organisation.
      // Coordinates are almost all of the response (~50MB for 23k parcels), and are kept as raw
      // JSON text, which the GraphQL response writes out verbatim.  As parsed arrays they would
      // take ~2.7x the memory, and need parsing and serialising again.
      this.parcelGeometries.set(
        key,
        this.get(`lms/organisation/${organisationId}/geometries`, {
          params: { bbox: '0,0,0,0', historicDate: formatDateDDMMMYY(new Date(date)) }
        }).then((body) =>
          typeof body === 'string' ? parseFeatureCollectionWithRawCoordinates(body) : body
        )
      )
    }
    return this.parcelGeometries.get(key)
  }

  // Parcel geometries keyed by `sheetId:parcelId`, built at most once per organisation and date
  // from the cached geometries response, so resolving the geometry of every parcel makes one
  // upstream call and constant-time lookups.  Parcels and geometries come from separate upstream
  // calls, so they're joined on sheetId + parcelId (the parcel's stable reference) rather than
  // the internal id.
  getParcelGeometryMapByOrganisationIdAndDate(organisationId, date) {
    this.parcelGeometryMaps ??= new Map()
    const key = this.#geometriesCacheKey(organisationId, date)
    if (!this.parcelGeometryMaps.has(key)) {
      this.parcelGeometryMaps.set(
        key,
        this.getParcelGeometriesByOrganisationIdAndDate(organisationId, date).then(
          (featureCollection) =>
            new Map(
              (featureCollection?.features ?? []).map(({ properties, geometry }) => [
                parcelGeometryKey(properties?.sheetId, properties?.parcelId),
                geometry ?? null
              ])
            )
        )
      )
    }
    return this.parcelGeometryMaps.get(key)
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

  async getLandUseByBusinessParcel(sbi, sheetId, parcelId, date = new Date()) {
    const response = await this.get(
      `SitiAgriApi/cv/landUseByBusinessParcel/sheet/${sheetId}/parcel/${parcelId}/sbi/${sbi}/list`,
      {
        params: {
          // pointInTime: current date/time formatted as `YYYY-MM-DD hh:mm:ss`
          pointInTime: formatDateAsUtcDateTime(new Date(date))
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
