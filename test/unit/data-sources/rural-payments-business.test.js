import { jest } from '@jest/globals'
import { RuralPaymentsBusiness } from '../../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { NotFound } from '../../../app/errors/graphql.js'
import { transformBusinessDetailsToOrgDetails } from '../../../app/transformers/rural-payments/business.js'

describe('Rural Payments Business', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    silly: jest.fn()
  }
  const ruralPaymentsBusiness = new RuralPaymentsBusiness({ logger })
  const httpGet = jest.spyOn(ruralPaymentsBusiness, 'get')
  const httpPost = jest.spyOn(ruralPaymentsBusiness, 'post')
  const httpPut = jest.spyOn(ruralPaymentsBusiness, 'put')

  beforeEach(() => {
    jest.clearAllMocks()
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

  describe('getOrganisationIdBySBI', () => {
    test('should return organisation ID when found by SBI', async () => {
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

  describe('getParcelsByOrganisationId', () => {
    test('should return parcels for organisation', async () => {
      const mockResponse = { parcels: [{ id: 1 }, { id: 2 }] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getParcelsByOrganisationId(123)
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith('lms/organisation/123/parcels')
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
        '2024-03-19'
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith(
        'lms/organisation/123/parcel/sheet-id/sheet1/parcel-id/parcel1/historic/19-Mar-24/land-covers'
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
    test('should return county parish holdings list', async () => {
      const mockResponse = { data: 'mockData' }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusiness.getCountyParishHoldingsBySBI('mockSbi')
      expect(result).toEqual(mockResponse.data)
      expect(httpGet).toHaveBeenCalledWith('SitiAgriApi/cv/cphByBusiness/sbi/mockSbi/list')
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

  describe('getAgreementsBySBI', () => {
    test('should return agreements list', async () => {
      const mockResponse = {}
      httpPut.mockImplementationOnce(async () => mockResponse)

      const updateDetails = {
        name: 'HADLEY FARMS LTD',
        reference: '12345678',
        vat: 'GB123456789',
        traderNumber: 'TRADER001',
        vendorNumber: 'VENDOR001',
        address: {
          pafOrganisationName: null,
          line1: 'Bowling Green Cottage',
          line2: 'HAMPSTEAD NORREYS',
          line3: null,
          line4: null,
          line5: null,
          buildingNumberRange: null,
          buildingName: 'COLSHAW HALL',
          flatName: null,
          street: 'SPINNING WHEEL MEAD',
          city: 'BRAINTREE',
          county: null,
          postalCode: 'LL53 8NT',
          country: 'United Kingdom',
          uprn: '10008042952',
          dependentLocality: 'HIGH HAWSKER',
          doubleDependentLocality: null,
          typeId: null
        },
        phone: {
          mobile: '01234042273',
          landline: '01234613020',
          fax: null
        },
        email: {
          address: 'hadleyfarmsltdp@defra.com.test',
          validated: false,
          doNotContact: false
        },
        type: {
          code: 101443,
          type: 'Not Specified'
        },
        correspondenceEmail: {
          address: null
        },
        correspondencePhone: {
          mobile: null,
          landline: null,
          fax: null
        },
        isCorrespondenceAsBusinessAddr: null
      }

      await ruralPaymentsBusiness.updateOrganisationDetails('123', updateDetails)
      expect(httpPut).toHaveBeenCalledWith('organisation/123/business-details', {
        body: transformBusinessDetailsToOrgDetails(updateDetails),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })
})
