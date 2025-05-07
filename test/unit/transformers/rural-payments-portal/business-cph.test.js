import {
  transformCPHInfo,
  transformOrganisationCPH
} from '../../../../app/transformers/rural-payments/business-cph.js'
import { organisationCPH, organisationCPHInfo } from '../../../fixtures/organisation-cph.js'

const organisationCPHInfoFixture = organisationCPHInfo('5565448').data
const organisationCPHFixture = organisationCPH('5565448').data

describe('Test Business CPHField Transformer', () => {
  describe('transformOrganisationCPH', () => {
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
        transformOrganisationCPH('id', [
          {
            cphNumber: '43/060/0025',
            parcelNumbers: ['SP2936 2318']
          }
        ])
      ).toEqual([
        {
          number: '43/060/0025',
          parcelNumbers: ['SP2936 2318']
        }
      ])
    })
  })

  describe('transformCPHInfo', () => {
    test('given input is empty, should return null', () => {
      expect(transformCPHInfo(null)).toEqual(null)
    })

    test('given input has coordinates populated, should return null', () => {
      expect(
        transformCPHInfo('10/327/0023', organisationCPHFixture, organisationCPHInfoFixture)
      ).toEqual({
        parish: 'FILLEIGH',
        species: ['OTHER'],
        parcelNumbers: ['SS6927 1650'],
        number: '10/327/0023',
        startDate: '2013-10-09T23:00:00.000Z',
        expiryDate: '2016-03-02T00:00:00.000Z',
        coordinate: { y: 128000, x: 267000 }
      })
    })
  })
})
