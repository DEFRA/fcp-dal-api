import { describe, jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import {
  formatDateDDMMMYY,
  RuralPaymentsBusiness
} from '../../../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { BadRequest, NotFound } from '../../../../app/errors/graphql.js'
import { transformBusinessDetailsToOrgDetailsUpdate } from '../../../../app/transformers/rural-payments/business.js'

const businessDetailsUpdatePayload = {
  name: 'HADLEY FARMS LTD 2',
  address: {
    pafOrganisationName: 'pafOrganisationName',
    line1: 'line1',
    line2: 'line2',
    line3: 'line3',
    line4: 'line4',
    line5: 'line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    flatName: null,
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null
  },
  correspondenceAddress: {
    pafOrganisationName: 'c pafOrganisationName',
    line1: 'c line1',
    line2: 'c line2',
    line3: 'c line3',
    line4: 'c line4',
    line5: 'c line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'buildingName',
    flatName: 'flatName',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: '1231231',
    country: 'USA',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: 'doubleDependentLocality'
  },
  phone: {
    mobile: '01234042273',
    landline: '01234613020'
  },
  email: {
    address: 'hadleyfarmsltdp@defra.com.test'
  },
  correspondenceEmail: {
    address: 'hadleyfarmsltdp@defra.com.123'
  },
  correspondencePhone: {
    mobile: '07111222333',
    landline: '01225111222'
  },
  isCorrespondenceAsBusinessAddress: false
}

const orgDetailsUpdatePayload = transformBusinessDetailsToOrgDetailsUpdate(
  businessDetailsUpdatePayload
)

describe('Rural Payments Business', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn()
  }
  const datasourceOptions = [
    { logger },
    {
      gatewayType: 'internal'
    }
  ]
  const ruralPaymentsBusiness = new RuralPaymentsBusiness(...datasourceOptions)

  const tokenValue = jwt.sign(
    {
      relationships: ['123:123456789']
    },
    'test-secret'
  )
  const ruralPaymentsBusinessExt = new RuralPaymentsBusiness(
    { logger },
    {
      gatewayType: 'external',
      request: {
        headers: {
          'x-forwarded-authorization': tokenValue
        }
      }
    }
  )
  const httpGet = jest.spyOn(ruralPaymentsBusiness, 'get')
  const httpPost = jest.spyOn(ruralPaymentsBusiness, 'post')
  const httpPut = jest.spyOn(ruralPaymentsBusiness, 'put')

  beforeEach(() => {
    jest.clearAllMocks()
    ruralPaymentsBusiness.geometriesCache?.clear()
  })

  describe('getOrganisationById', () => {
    test('should return organisation data when found', async () => {
      const mockResponse = { _data: { id: 123, name: 'Test Org' } }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getOrganisationById(123)
      expect(result).toEqual(mockResponse._data)
      expect(httpGet).toHaveBeenCalledWith('organisation/123')
    })

    test('should throw NotFound when organisation not found', async () => {
      httpGet.mockImplementationOnce(async () => ({ _data: {} }))

      await expect(ruralPaymentsBusiness.getOrganisationById(123)).rejects.toEqual(
        new NotFound('Rural payments organisation not found')
      )
      expect(logger.warn).toHaveBeenCalledWith(
        '#datasource - Rural payments - organisation not found for organisation ID',
        { organisationId: 123, code: 'RURALPAYMENTS_API_NOT_FOUND_001' }
      )
    })
  })

  describe('getOrganisationBySBI', () => {
    test('should return organisation data when found by SBI', async () => {
      const mockSearchResponse = { _data: [{ id: 123 }] }
      const mockOrgResponse = { _data: { id: 123, name: 'Test Org' } }
      httpPost.mockImplementationOnce(async () => mockSearchResponse)
      httpGet.mockImplementationOnce(async () => mockOrgResponse)

      const result = await ruralPaymentsBusiness.getOrganisationBySBI('123456789')
      expect(result).toEqual(mockOrgResponse._data)
      expect(httpPost).toHaveBeenCalledWith('organisation/search', {
        body: JSON.stringify({
          searchFieldType: 'SBI',
          primarySearchPhrase: '123456789',
          offset: 0,
          limit: 1
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('organisationSearch', () => {
    test('should post search request with pagination and return data and page', async () => {
      const mockResponse = {
        _data: [{ id: 123, name: 'Test Farm' }],
        _page: { number: 2, size: 20, totalPages: 3, numberOfElements: 1, totalElements: 41 }
      }
      httpPost.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.organisationSearch('BUSINESS_NAME', 'Test Farm', {
        page: 2,
        perPage: 20
      })

      expect(result).toEqual({ data: mockResponse._data, page: mockResponse._page })
      expect(httpPost).toHaveBeenCalledWith('organisation/search', {
        body: JSON.stringify({
          searchFieldType: 'BUSINESS_NAME',
          primarySearchPhrase: 'Test Farm',
          offset: 20,
          limit: 20
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should default pagination and return empty data when no results', async () => {
      const mockResponse = {
        _data: [],
        _page: { number: 1, size: 100, totalPages: 0, numberOfElements: 0, totalElements: 0 }
      }
      httpPost.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.organisationSearch('BUSINESS_POSTCODE', 'AB12 3CD')

      expect(result).toEqual({ data: [], page: mockResponse._page })
      expect(httpPost).toHaveBeenCalledWith('organisation/search', {
        body: JSON.stringify({
          searchFieldType: 'BUSINESS_POSTCODE',
          primarySearchPhrase: 'AB12 3CD',
          offset: 0,
          limit: 100
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should default page only when perPage provided without page', async () => {
      httpPost.mockImplementationOnce(async () => ({ _data: [], _page: undefined }))

      await ruralPaymentsBusiness.organisationSearch('BUSINESS_NAME', 'Test Farm', { perPage: 25 })

      expect(httpPost).toHaveBeenCalledWith('organisation/search', {
        body: JSON.stringify({
          searchFieldType: 'BUSINESS_NAME',
          primarySearchPhrase: 'Test Farm',
          offset: 0,
          limit: 25
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should default perPage only when page provided without perPage', async () => {
      httpPost.mockImplementationOnce(async () => ({ _data: [], _page: undefined }))

      await ruralPaymentsBusiness.organisationSearch('BUSINESS_NAME', 'Test Farm', { page: 3 })

      expect(httpPost).toHaveBeenCalledWith('organisation/search', {
        body: JSON.stringify({
          searchFieldType: 'BUSINESS_NAME',
          primarySearchPhrase: 'Test Farm',
          offset: 200,
          limit: 100
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should return empty data and undefined page when response is empty', async () => {
      httpPost.mockImplementationOnce(async () => undefined)

      const result = await ruralPaymentsBusiness.organisationSearch('SBI', '123456789')

      expect(result).toEqual({ data: [], page: undefined })
    })

    test('should throw BadRequest when page is less than 1', async () => {
      await expect(
        ruralPaymentsBusiness.organisationSearch('BUSINESS_NAME', 'Test Farm', {
          page: 0,
          perPage: 20
        })
      ).rejects.toEqual(new BadRequest('Pagination page must be 1 or greater'))

      expect(httpPost).not.toHaveBeenCalled()
    })

    test('should throw BadRequest when perPage is less than 1', async () => {
      await expect(
        ruralPaymentsBusiness.organisationSearch('BUSINESS_NAME', 'Test Farm', {
          page: 1,
          perPage: 0
        })
      ).rejects.toEqual(new BadRequest('Pagination perPage must be 1 or greater'))

      expect(httpPost).not.toHaveBeenCalled()
    })
  })

  describe('getOrganisationIdBySBI', () => {
    test('should return organisation ID when found by SBI - internal', async () => {
      const mockSearchResponse = { _data: [{ id: 123 }] }
      httpPost.mockImplementationOnce(async () => mockSearchResponse)

      const result = await ruralPaymentsBusiness.getOrganisationIdBySBI('123456789')
      expect(result).toEqual(123)
      expect(httpPost).toHaveBeenCalledWith('organisation/search', {
        body: JSON.stringify({
          searchFieldType: 'SBI',
          primarySearchPhrase: '123456789',
          offset: 0,
          limit: 1
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should return organisation ID when found by SBI - external', async () => {
      const mockSearchResponse = { _data: [{ id: 123 }] }
      httpPost.mockImplementationOnce(async () => mockSearchResponse)

      const result = await ruralPaymentsBusinessExt.getOrganisationIdBySBI('123456789')
      expect(result).toEqual('123')
    })

    test('should throw NotFound when organisation not found by SBI', async () => {
      httpPost.mockImplementationOnce(async () => ({ _data: [] }))

      await expect(ruralPaymentsBusiness.getOrganisationIdBySBI('123456789')).rejects.toEqual(
        new NotFound('Rural payments organisation not found')
      )
      expect(logger.warn).toHaveBeenCalledWith(
        '#datasource - Rural payments - organisation not found for organisation SBI',
        { sbi: '123456789', code: 'RURALPAYMENTS_API_NOT_FOUND_001' }
      )
    })
  })

  describe('getOrganisationCustomersByOrganisationId', () => {
    test('should return organisation customers', async () => {
      const mockResponse = { _data: [{ id: 1 }, { id: 2 }] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(123)
      expect(result).toEqual(mockResponse._data)
      expect(httpGet).toHaveBeenCalledWith('authorisation/organisation/123')
    })
  })

  describe('getParcelsByOrganisationIdAndDate', () => {
    test('should return parcels for organisation and date', async () => {
      const mockResponse = { parcels: [{ id: 1 }, { id: 2 }] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate(
        123,
        '2024-03-19'
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith('lms/organisation/123/parcels/historic/19-Mar-24')
    })
  })

  describe('getGeometriesByOrganisationIdAndDate', () => {
    test('should return geometries for organisation and date', async () => {
      const mockResponse = { type: 'Polygon', coordinates: [] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(
        123,
        '2024-03-19'
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith(
        'lms/organisation/123/geometries?bbox=0,0,0,0&historicDate=19-Mar-24'
      )
    })

    test('should only call the upstream once for repeated calls with the same organisation and date', async () => {
      const mockResponse = { type: 'Polygon', coordinates: [] }
      httpGet.mockImplementation(async () => mockResponse)

      const [resultA, resultB] = await Promise.all([
        ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(123, '2024-03-19'),
        ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(123, '2024-03-19')
      ])
      const resultC = await ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(
        123,
        '2024-03-19'
      )

      expect(resultA).toEqual(mockResponse)
      expect(resultB).toEqual(mockResponse)
      expect(resultC).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledTimes(1)
    })

    test('should call the upstream again for a different organisation or date', async () => {
      httpGet.mockImplementation(async () => ({ type: 'Polygon', coordinates: [] }))

      await ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(123, '2024-03-19')
      await ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(456, '2024-03-19')
      await ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(123, '2024-03-20')

      expect(httpGet).toHaveBeenCalledTimes(3)
    })
  })

  describe('getParcelEffectiveDatesByOrganisationIdAndDate', () => {
    test('should return parcel effective dates', async () => {
      const mockResponse = { dates: ['19-Mar-24'] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getParcelEffectiveDatesByOrganisationIdAndDate(
        123,
        '2024-03-19'
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith('lms/organisation/123/parcel-details/historic/19-Mar-24')
    })
  })

  describe('getCoversByOrgSheetParcelIdDate', () => {
    test('should return covers for parcel', async () => {
      const mockResponse = { covers: [{ id: 1 }, { id: 2 }] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getCoversByOrgSheetParcelIdDate(
        123,
        'sheet1',
        'parcel1',
        '2024-03-19',
        false
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith(
        'lms/organisation/123/parcel/sheet-id/sheet1/parcel-id/parcel1/historic/19-Mar-24/land-covers?includeGeometries=false'
      )
    })

    test('should request geometries when includeGeometries is true', async () => {
      const mockResponse = { covers: [{ id: 1 }, { id: 2 }] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      await ruralPaymentsBusiness.getCoversByOrgSheetParcelIdDate(
        123,
        'sheet1',
        'parcel1',
        '2024-03-19',
        true
      )
      expect(httpGet).toHaveBeenCalledWith(
        'lms/organisation/123/parcel/sheet-id/sheet1/parcel-id/parcel1/historic/19-Mar-24/land-covers?includeGeometries=true'
      )
    })
  })

  describe('getCoversSummaryByOrganisationIdAndDate', () => {
    test('should return covers summary', async () => {
      const mockResponse = { summary: { total: 2 } }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        123,
        '2024-03-19'
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith('lms/organisation/123/covers-summary/historic/19-Mar-24')
    })
  })

  describe('getCountyParishHoldingsBySBI', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    test('should return county parish holdings list', async () => {
      jest.setSystemTime(new Date('2025-01-01T13:35:25'))

      const mockResponse = { data: 'mockData' }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getCountyParishHoldingsBySBI('mockSbi')
      expect(result).toEqual(mockResponse.data)

      expect(httpGet).toHaveBeenCalledWith('SitiAgriApi/cv/cphByBusiness/sbi/mockSbi/list', {
        params: { pointInTime: '2025-01-01 13:35:25' }
      })
    })
  })

  describe('getAgreementsBySBI', () => {
    test('should return agreements list', async () => {
      const mockResponse = { data: 'mockData' }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getAgreementsBySBI('mockSbi')
      expect(result).toEqual(mockResponse.data)
      expect(httpGet).toHaveBeenCalledWith('SitiAgriApi/cv/agreementsByBusiness/sbi/mockSbi/list')
    })
  })

  describe('getApplicationsBySBI', () => {
    test('should return applications list', async () => {
      const mockResponse = { data: 'mockData' }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getApplicationsBySBI('mockSbi')
      expect(result).toEqual(mockResponse.data)
      expect(httpGet).toHaveBeenCalledWith('SitiAgriApi/cv/appByBusiness/sbi/mockSbi/list')
    })
  })

  describe('updateOrganisationDetails', () => {
    test('should call put endpoint and return successful response', async () => {
      const fakeResponse = {
        response: 'success'
      }
      httpPut.mockImplementationOnce(async () => fakeResponse)

      const response = await ruralPaymentsBusiness.updateOrganisationDetails(
        'orgId',
        orgDetailsUpdatePayload
      )
      expect(httpPut).toHaveBeenCalledWith('organisation/orgId/business-details', {
        body: orgDetailsUpdatePayload,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(response).toEqual(fakeResponse)
    })

    test('should fail if error is thrown by put request', async () => {
      const mockError = new Error('fetch error')
      httpPut.mockRejectedValueOnce(mockError)

      await expect(
        ruralPaymentsBusiness.updateOrganisationDetails('123', orgDetailsUpdatePayload)
      ).rejects.toThrow(mockError)
      expect(httpPut).toHaveBeenCalledWith('organisation/123/business-details', {
        body: orgDetailsUpdatePayload,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('formatDateDDMMMYY', () => {
    test('should correctly format the date', async () => {
      const date = new Date('2024-09-19')
      const response = formatDateDDMMMYY(date)
      expect(response).toEqual('19-Sep-24')
    })
  })

  describe('lockOrganisation', () => {
    test('should call post endpoint and return successful response', async () => {
      const fakeResponse = {
        response: 'success'
      }
      httpPost.mockImplementationOnce(async () => fakeResponse)

      const response = await ruralPaymentsBusiness.lockOrganisation('orgId', { reason: 'test' })
      expect(httpPost).toHaveBeenCalledWith('organisation/orgId/lock', {
        body: { partyNoteType: 'LockOrganisation', reason: 'test' },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(response).toEqual(fakeResponse)
    })

    test('should fail if error is thrown by post request', async () => {
      const mockError = new Error('fetch error')
      httpPost.mockRejectedValueOnce(mockError)

      await expect(
        ruralPaymentsBusiness.lockOrganisation('123', { reason: 'test' })
      ).rejects.toThrow(mockError)
      expect(httpPost).toHaveBeenCalledWith('organisation/123/lock', {
        body: { partyNoteType: 'LockOrganisation', reason: 'test' },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should throw error when business is already locked', async () => {
      const mockError = new Error('fetch error')
      mockError.extensions = { http: { status: 500 } }
      httpPost.mockRejectedValueOnce(mockError)

      httpGet.mockImplementationOnce(async () => ({ _data: { id: '123', locked: true } }))

      await expect(
        ruralPaymentsBusiness.lockOrganisation('123', { reason: 'test' })
      ).rejects.toThrow('Business is already locked')
    })
  })

  describe('unlockOrganisation', () => {
    test('should call post endpoint and return successful response', async () => {
      const fakeResponse = {
        response: 'success'
      }
      httpPost.mockImplementationOnce(async () => fakeResponse)

      const response = await ruralPaymentsBusiness.unlockOrganisation('orgId', { reason: 'test' })
      expect(httpPost).toHaveBeenCalledWith('organisation/orgId/unlock', {
        body: { partyNoteType: 'UnlockOrganisation', reason: 'test' },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(response).toEqual(fakeResponse)
    })

    test('should fail if error is thrown by post request', async () => {
      const mockError = new Error('fetch error')
      httpPost.mockRejectedValueOnce(mockError)

      await expect(
        ruralPaymentsBusiness.unlockOrganisation('123', { reason: 'test' })
      ).rejects.toThrow(mockError)
      expect(httpPost).toHaveBeenCalledWith('organisation/123/unlock', {
        body: { partyNoteType: 'UnlockOrganisation', reason: 'test' },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    test('should throw error when business is already unlocked', async () => {
      const mockError = new Error('fetch error')
      mockError.extensions = { http: { status: 500 } }
      httpPost.mockRejectedValueOnce(mockError)

      httpGet.mockImplementationOnce(async () => ({ _data: { id: '123', locked: false } }))

      await expect(
        ruralPaymentsBusiness.unlockOrganisation('123', { reason: 'test' })
      ).rejects.toThrow('Business is already unlocked')
    })
  })

  describe('getLandUseByBusinessParcel', () => {
    test('should return land use by business parcel without date', async () => {
      const mockResponse = { data: 'mockData' }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getLandUseByBusinessParcel(
        'mockSbi',
        'mockSheetId',
        'mockParcelId'
      )

      expect(result).toEqual(mockResponse.data)
      expect(httpGet).toHaveBeenCalledWith(
        'SitiAgriApi/cv/landUseByBusinessParcel/sheet/mockSheetId/parcel/mockParcelId/sbi/mockSbi/list',
        {
          params: { pointInTime: new Date().toISOString().replace('T', ' ').substring(0, 19) }
        }
      )
    })

    test('should return land use by business parcel with date', async () => {
      const mockResponse = { data: 'mockData' }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getLandUseByBusinessParcel(
        'mockSbi',
        'mockSheetId',
        'mockParcelId',
        new Date('2025-01-01T13:35:25')
      )

      expect(result).toEqual(mockResponse.data)
      expect(httpGet).toHaveBeenCalledWith(
        'SitiAgriApi/cv/landUseByBusinessParcel/sheet/mockSheetId/parcel/mockParcelId/sbi/mockSbi/list',
        {
          params: { pointInTime: '2025-01-01 13:35:25' }
        }
      )
    })
  })

  describe('submitBankChange', () => {
    test('posts the submission to the bank change service endpoint', async () => {
      httpPost.mockResolvedValueOnce({})

      const submission = {
        organisationId: '5583781',
        personId: '5020949',
        sbi: '110405990',
        frn: '10014489653',
        crn: '1100209492',
        submissionDateTime: '02/05/2026 14:12:11',
        account: {
          accountType: 'UK_BUSINESS',
          name: 'John Doe',
          number: '14345678',
          bank: { name: 'Acme Bank', sortCode: '123456' }
        }
      }

      const result = await ruralPaymentsBusiness.submitBankChange(submission)

      expect(httpPost).toHaveBeenCalledWith('bank-change-service/v1/submit', {
        body: submission,
        headers: expect.any(Object)
      })
      expect(result).toEqual({})
    })
  })

  describe('validateBankChange', () => {
    test('posts the submission to the validate endpoint', async () => {
      const validateResponse = {
        status: 'MATCH',
        message: 'All good',
        attemptsRemaining: 0,
        account: { bank: { name: 'Acme Bank', sortCode: '123456' } }
      }
      httpPost.mockResolvedValueOnce(validateResponse)

      const submission = {
        organisationId: '5583781',
        sbi: '110405990',
        account: {
          accountType: 'UK_BUSINESS',
          name: 'John Doe',
          number: '14345678',
          bank: { name: 'Acme Bank', sortCode: '123456' }
        }
      }

      const result = await ruralPaymentsBusiness.validateBankChange(submission)

      expect(httpPost).toHaveBeenCalledWith('bank-change-service/v1/validate', {
        body: submission,
        headers: expect.any(Object)
      })
      expect(result).toEqual(validateResponse)
    })
  })

  describe('getBankChangeLockedStatus', () => {
    test('gets the locked status for an organisation/person pair', async () => {
      httpGet.mockResolvedValueOnce({ locked: true })

      const result = await ruralPaymentsBusiness.getBankChangeLockedStatus('5583781', '5020949')

      expect(httpGet).toHaveBeenCalledWith('bank-change-service/v1/locked-status/5583781/5020949')
      expect(result).toEqual({ locked: true })
    })
  })

  describe('getBankChangeAccountStatus', () => {
    test('gets the account status for an organisation', async () => {
      const accountStatus = {
        editable: true,
        submitted: false,
        updatedRecently: false,
        new: false
      }
      httpGet.mockResolvedValueOnce(accountStatus)

      const result = await ruralPaymentsBusiness.getBankChangeAccountStatus('5583781')

      expect(httpGet).toHaveBeenCalledWith('bank-change-service/v1/account-status/5583781')
      expect(result).toEqual(accountStatus)
    })
  })
})
