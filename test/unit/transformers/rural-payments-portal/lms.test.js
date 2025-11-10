import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels,
  transformLandParcelsEffectiveDates,
  transformLandUses
} from '../../../../app/transformers/rural-payments/lms.js'

describe('LMS transformer', () => {
  test('transformLandCovers', () => {
    const input = {
      type: 'FeatureCollection',
      features: [
        {
          id: 'mockId',
          geometry: null,
          properties: {
            area: '1000',
            code: 'mockId',
            name: 'Mock Name',
            isBpsEligible: 'true'
          },
          type: 'Feature'
        }
      ]
    }
    const output = [
      { area: 0.1, id: 'mockId', name: 'Mock Name', code: 'mockId', isBpsEligible: true }
    ]
    expect(transformLandCovers(input)).toEqual(output)
  })

  test('transformLandCoversToArea', () => {
    const input = ['mockName', [{ name: 'mockName', area: 1000 }]]
    const output = 0.1
    expect(transformLandCoversToArea(...input)).toEqual(output)
  })

  test('transformLandCoversToArea - no name found', () => {
    const input = ['mockName', [{ name: 'no-name', area: 1000 }]]
    const output = 0
    expect(transformLandCoversToArea(...input)).toEqual(output)
  })

  test('transformLandParcels', () => {
    const input = [
      {
        id: 'mockId',
        sheetId: 'mockSheetId',
        area: 1000,
        parcelId: 'mockParcelId',
        pendingDigitisation: false
      }
    ]
    const output = [
      {
        id: 'mockId',
        sheetId: 'mockSheetId',
        area: 0.1,
        parcelId: 'mockParcelId',
        pendingDigitisation: false
      }
    ]
    expect(transformLandParcels(input)).toEqual(output)
  })

  test('transformLandParcelsEffectiveDates', () => {
    const parcelId = 'mockParcelId'
    const sheetId = 'mockSheetId'
    const parcels = [{ parcelId, sheetId, validFrom: '2023-01-01', validTo: '2024-01-01' }]
    const output = {
      effectiveTo: '2024-01-01T00:00:00.000Z',
      effectiveFrom: '2023-01-01T00:00:00.000Z'
    }
    expect(transformLandParcelsEffectiveDates(parcelId, sheetId, parcels)).toEqual(output)
  })

  describe('#transformLandUses', () => {
    let input
    let expectedOutput
    beforeEach(() => {
      input = [
        {
          start_date: '2015-09-16T09:50:01:000+0000',
          end_date: '2015-09-16T09:50:01:000+0000',
          dt_insert: '2015-09-16T09:50:01:000+0000',
          dt_delete: '2015-09-16T09:50:01:000+0000',
          campaign: 1,
          lu_code: 'mockCode',
          landuse: 'mockLanduse',
          area: 1000,
          length: null
        }
      ]

      expectedOutput = [
        {
          startDate: '2015-09-16T09:50:01.000Z',
          endDate: '2015-09-16T09:50:01.000Z',
          insertDate: '2015-09-16T09:50:01.000Z',
          deleteDate: '2015-09-16T09:50:01.000Z',
          campaign: 1,
          code: 'mockCode',
          type: 'mockLanduse',
          area: 0.1,
          length: null
        }
      ]
    })

    test('transformLandUses - no length', () => {
      expect(transformLandUses(input)).toEqual(expectedOutput)
    })

    test('transformLandUses - no area', () => {
      input[0].area = null
      input[0].length = 1000
      expectedOutput[0].area = null
      expectedOutput[0].length = 1000
      expect(transformLandUses(input)).toEqual(expectedOutput)
    })
  })
})
