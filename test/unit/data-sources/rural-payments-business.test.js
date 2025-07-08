import { jest } from '@jest/globals'
import { RuralPaymentsBusiness } from '../../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { NotFound } from '../../../app/errors/graphql.js'

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

const orgDetailsUpdatePayload = {
  name: 'HADLEY FARMS LTD 2',
  address: {
    address1: 'line1',
    address2: 'line2',
    address3: 'line3',
    address4: 'line4',
    address5: 'line5',
    pafOrganisationName: 'pafOrganisationName',
    flatName: null,
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null,
    typeId: undefined
  },
  correspondenceAddress: {
    address1: 'c line1',
    address2: 'c line2',
    address3: 'c line3',
    address4: 'c line4',
    address5: 'c line5',
    dependentLocality: 'HIGH HAWSKER',
    pafOrganisationName: 'c pafOrganisationName',
    doubleDependentLocality: 'doubleDependentLocality',
    buildingName: 'buildingName',
    buildingNumberRange: 'buildingNumberRange',
    city: 'city',
    country: 'USA',
    county: 'county',
    flatName: 'flatName',
    postalCode: '1231231',
    street: 'street',
    uprn: '10008042952',
    typeId: undefined
  },
  isCorrespondenceAsBusinessAddr: false,
  email: 'hadleyfarmsltdp@defra.com.test',
  landline: '01234613020',
  mobile: '01234042273',
  correspondenceEmail: 'hadleyfarmsltdp@defra.com.123',
  correspondenceLandline: '01225111222',
  correspondenceMobile: '07111222333',
  businessType: { id: 0 }
}

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

  describe('updateBusinessBySBI', () => {
    test('should update organisation details', async () => {
      const mockResponse = {}
      const mockSearchResponse = { _data: [{ id: 123 }] }
      httpPost.mockImplementationOnce(async () => mockSearchResponse)
      httpPut.mockImplementationOnce(async () => mockResponse)

      await ruralPaymentsBusiness.updateBusinessDetailsBySBI(
        '123456789',
        businessDetailsUpdatePayload
      )
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
      expect(httpPut).toHaveBeenCalledWith('organisation/123/business-details', {
        body: orgDetailsUpdatePayload,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('updateOrganisationDetails', () => {
    test('should update organisation details with full payload', async () => {
      const mockResponse = {}
      httpPut.mockImplementationOnce(async () => mockResponse)

      await ruralPaymentsBusiness.updateOrganisationDetails('123', businessDetailsUpdatePayload)
      expect(httpPut).toHaveBeenCalledWith('organisation/123/business-details', {
        body: orgDetailsUpdatePayload,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
    test('should update organisation details with partial payload & request org details for remainder', async () => {
      const mockResponse = {}
      const mockOrgDetailsResponse = { _data: { id: 123, name: 'Existing Name' } }
      httpPut.mockImplementationOnce(async () => mockResponse)
      httpGet.mockImplementationOnce(async () => mockOrgDetailsResponse)

      const updateDetails = { ...businessDetailsUpdatePayload }
      delete updateDetails.name

      await ruralPaymentsBusiness.updateOrganisationDetails('123', updateDetails)
      expect(httpPut).toHaveBeenCalledWith('organisation/123/business-details', {
        body: {
          ...orgDetailsUpdatePayload,
          name: 'Existing Name'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })
})
