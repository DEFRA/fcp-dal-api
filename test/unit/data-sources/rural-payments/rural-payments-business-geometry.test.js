import { describe, jest } from '@jest/globals'
import { RuralPaymentsBusinessGeometry } from '../../../../app/data-sources/rural-payments/RuralPaymentsBusinessGeometry.js'

describe('Rural Payments Business Geometry', () => {
  const datasourceOptions = [
    {},
    {
      gatewayType: 'internal'
    }
  ]
  const ruralPaymentsBusinessGeometry = new RuralPaymentsBusinessGeometry(...datasourceOptions)

  const httpGet = jest.spyOn(ruralPaymentsBusinessGeometry, 'get')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getGeometriesByOrganisationIdAndDate', () => {
    test('should return geometries for organisation and date', async () => {
      const mockResponse = { type: 'Polygon', coordinates: [] }
      httpGet.mockImplementationOnce(async () => mockResponse)

      const result = await ruralPaymentsBusinessGeometry.getGeometriesByOrganisationIdAndDate(
        123,
        '2024-03-19'
      )
      expect(result).toEqual(mockResponse)
      expect(httpGet).toHaveBeenCalledWith(
        'lms/organisation/123/geometries?bbox=0,0,0,0&historicDate=19-Mar-24'
      )
    })
  })
})
