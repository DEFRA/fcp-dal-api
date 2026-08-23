import { describe, jest } from '@jest/globals'
import { RuralPaymentsReferenceData } from '../../../../app/data-sources/rural-payments/RuralPaymentsReferenceData.js'

describe('RuralPaymentsReferenceData', () => {
  const ruralPaymentsReferenceData = new RuralPaymentsReferenceData(
    { logger: console },
    { request: { headers: { email: 'test@test.test' } } }
  )
  const httpGet = jest.spyOn(ruralPaymentsReferenceData, 'get')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCountryCodes', () => {
    test('gets the country code to currency mapping', async () => {
      const countryCodes = {
        countriesCurrency: {
          GB: 'GBP',
          IE: 'EUR',
          PT: 'EUR'
        }
      }
      httpGet.mockResolvedValueOnce(countryCodes)

      const result = await ruralPaymentsReferenceData.getCountryCodes()

      expect(httpGet).toHaveBeenCalledWith('bank-change-service/v1/country-codes')
      expect(result).toEqual(countryCodes)
    })
  })

  describe('getBusinessTypes', () => {
    test('gets the business types', async () => {
      const businessTypes = {
        _data: [
          { id: 1, type: 'Sole Trader' },
          { id: 2, type: 'Partnership' }
        ]
      }
      httpGet.mockResolvedValueOnce(businessTypes)

      const result = await ruralPaymentsReferenceData.getReferenceData('business-types')

      expect(httpGet).toHaveBeenCalledWith('reference/business-types')
      expect(result).toEqual(businessTypes)
    })
  })

  describe('getLegalStatuses', () => {
    test('gets the legal statuses', async () => {
      const legalStatuses = {
        _data: [
          { id: 1, type: 'Active' },
          { id: 2, type: 'Inactive' }
        ]
      }
      httpGet.mockResolvedValueOnce(legalStatuses)

      const result = await ruralPaymentsReferenceData.getReferenceData('legalstatus')

      expect(httpGet).toHaveBeenCalledWith('reference/legalstatus')
      expect(result).toEqual(legalStatuses)
    })
  })

  describe('getTitles', () => {
    test('gets the titles', async () => {
      const titles = { _data: ['Mr', 'Mrs'] }
      httpGet.mockResolvedValueOnce(titles)

      const result = await ruralPaymentsReferenceData.getReferenceData('titles')

      expect(httpGet).toHaveBeenCalledWith('reference/titles')
      expect(result).toEqual(titles)
    })
  })
})
