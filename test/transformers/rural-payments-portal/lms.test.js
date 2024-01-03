import {
  transformLandCovers,
  transformLandCoversToArea, transformLandParcels
} from '../../../app/transformers/rural-payments-portal/lms.js'

describe('LMS transformer', () => {
  test('transformLandCovers', () => {
    const input = [{ id: 'mockId', info: [{ area: 1000, name: 'Mock Name' }] }]
    const output = [{ area: 1000, id: 'mockId', name: 'MOCK_NAME' }]
    expect(transformLandCovers(input)).toEqual(output)
  })

  test('transformLandCoversToArea', () => {
    const input = ['mockName', [{ name: 'mockName', area: 1000 }]]
    const output = 1000
    expect(transformLandCoversToArea(...input)).toEqual(output)
  })

  test('transformLandParcels', () => {
    const input = [{ id: 'mockId', sheetId: 'mockSheetId', area: 1000, otherField: 'mock' }]
    const output = [{ id: 'mockId', sheetId: 'mockSheetId', area: 1000 }]
    expect(transformLandParcels(input)).toEqual(output)
  })
})
