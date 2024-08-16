import {
  transformOrganisationCPH,
  transformOrganisationCPHCoordinates
} from '../../../app/transformers/rural-payments/business-cph.js'

describe('Test Business CPHField Transformer', () => {
  describe('transformOrganisationCPH', () => {
    const systemUnderTest = transformOrganisationCPH

    test('given id is not populated, should return null', () => {
      expect(
        transformOrganisationCPH(null, [
          {
            cphNumber: '43/060/0025',
            parcelNumbers: ['SP2936 2318']
          }
        ])
      ).toEqual(null)
    })

    test('given data is not populated, should return null', () => {
      expect(transformOrganisationCPH('ID', null)).toEqual(null)
    })

    test('given input is populated with all the fields, should enrich and transform to new data model', () => {
      expect(
        systemUnderTest('id', [
          {
            cphNumber: '43/060/0025',
            parcelNumbers: ['SP2936 2318']
          }
        ])
      ).toEqual([
        {
          businessId: 'id',
          number: '43/060/0025',
          parcelNumbers: ['SP2936 2318']
        }
      ])
    })
  })

  describe('transformOrganisationCPHCoordinates', () => {
    const systemUnderTest = transformOrganisationCPHCoordinates

    test('given input is empty, should return null', () => {
      expect(systemUnderTest(null)).toEqual(null)
    })

    test('given input has coordinates populated, should return null', () => {
      expect(
        systemUnderTest({
          yCoordinate: 22312,
          xCoordinate: 42312
        })
      ).toEqual({
        x: 42312,
        y: 22312
      })
    })
  })
})
