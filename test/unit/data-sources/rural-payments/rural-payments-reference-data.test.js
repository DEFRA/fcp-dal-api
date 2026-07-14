import { describe, jest } from '@jest/globals'
import { RuralPaymentsReferenceData } from '../../../../app/data-sources/rural-payments/RuralPaymentsReferenceData.js'

describe('RuralPaymentsReferenceData', () => {
  const ruralPaymentsReferenceData = new RuralPaymentsReferenceData(
    { logger: console },
    { gatewayType: 'internal' }
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
})
