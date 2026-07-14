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
})
