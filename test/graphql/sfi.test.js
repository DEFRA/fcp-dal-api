import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import { config } from '../../app/config.js'
import { makeTestQuery } from './makeTestQuery.js'

const query = `#graphql
    query BusinessTest {
      business(sbi: "sbi") {
        organisationId
        sbi
        info {
          name
          address {
            line1
            line2
            line3
            line4
            line5
            street
            city
            postalCode
          }
          email {
            address
          }
          phone {
            mobile
          }
        }
        land {
          parcels(date: "2025-05-04") {
            sheetId
            parcelId
          }
        }
      }
    }
  `

const setupNock = (v1) => {
  v1.get('/organisation/organisationId').reply(200, {
    _data: {
      id: 'organisationId',
      sbi: 'sbi',
      name: 'name',
      email: 'email address',
      address: {
        address1: 'line1',
        address2: 'line2',
        address3: 'line3',
        address4: 'line4',
        address5: 'line5',
        pafOrganisationName: 'paf organisation name',
        buildingNumberRange: 'building number range',
        buildingName: 'building name',
        flatName: 'flat name',
        street: 'street',
        city: 'city',
        county: 'county',
        postalCode: 'postal code',
        country: 'country',
        uprn: 'uprn',
        dependentLocality: 'dependent locality',
        doubleDependentLocality: 'double dependent locality',
        addressTypeId: 'address type'
      },
      legalStatus: {
        id: 101,
        type: 'legal type'
      },
      landline: 'landline number',
      mobile: 'mobile number',
      traderNumber: 'trader number',
      businessType: {
        id: 101,
        type: 'business type'
      },
      taxRegistrationNumber: 'vat number',
      vendorNumber: 'vendor number',
      businessReference: 'businessReference'
    }
  })

  v1.get('/lms/organisation/organisationId/parcels/historic/04-May-25').reply(200, [
    {
      id: 'id',
      sheetId: 'sheetId',
      parcelId: 'parcelId',
      area: 1,
      pendingDigitisation: true
    }
  ])
}

describe('SFI Query', () => {
  let configMockPath

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    configMockPath = {
      'auth.disabled': false
    }
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('business - authenticated external', async () => {
    const v1 = nock(config.get('kits.external.gatewayUrl'))
    setupNock(v1)

    // For external requests we extract org id from token but don't verify.
    // so any jwt with a valid relationships array works
    const tokenValue = jwt.sign(
      {
        contactId: '123',
        relationships: ['organisationId:sbi']
      },
      'test-secret'
    )

    const result = await makeTestQuery(
      query,
      {
        'gateway-type': 'external',
        'x-forwarded-authorization': tokenValue
      },
      false,
      {},
      [config.get('auth.groups.SFI_REFORM')]
    )

    expect(result).toEqual({
      data: {
        business: {
          organisationId: 'organisationId',
          sbi: 'sbi',
          info: {
            name: 'name',
            address: {
              line1: 'line1',
              line2: 'line2',
              line3: 'line3',
              line4: 'line4',
              line5: 'line5',
              street: 'street',
              city: 'city',
              postalCode: 'postal code'
            },
            email: { address: 'email address' },
            phone: { mobile: 'mobile number' }
          },
          land: {
            parcels: [
              {
                sheetId: 'sheetId',
                parcelId: 'parcelId'
              }
            ]
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })
})
