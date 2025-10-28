import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import { config } from '../../app/config.js'
import { Unauthorized } from '../../app/errors/graphql.js'
import { mockOrganisationSearch } from './helpers.js'
import { makeTestQuery } from './makeTestQuery.js'

const query = `#graphql
    query BusinessTest {
      business(sbi: "sbi") {
        organisationId
        sbi
        info {
          name
          address {
            pafOrganisationName
            line1
            line2
            line3
            line4
            line5
            buildingNumberRange
            buildingName
            flatName
            street
            city
            county
            postalCode
            country
            uprn
            dependentLocality
            doubleDependentLocality
            typeId
          }
          email {
            address
          }
          legalStatus {
            code
            type
          }
          phone {
            mobile
            landline
          }
          traderNumber
          type {
            code
            type
          }
          vat
          vendorNumber
        }
        land {
          parcels(date: "2025-05-04") {
            id
            sheetId
            parcelId
            area
            pendingDigitisation
          }
          parcel(sheetId: "sheetId", parcelId: "parcelId", date: "2025-05-04") {
            id
            sheetId
            parcelId
            area
            pendingDigitisation
            effectiveToDate
            effectiveFromDate
          }
          parcelCovers(sheetId: "sheetId", parcelId: "parcelId", date: "2025-05-04") {
            id
            name
            area
            code
            isBpsEligible
          }
          summary(date: "2025-05-04") {
            arableLandArea
            permanentCropsArea
            permanentGrasslandArea
            totalArea
            totalParcels
          }
        }
        customers {
          personId
          firstName
          lastName
          crn
          role
        }
        customer(crn: "customerReference") {
          personId
          firstName
          lastName
          crn
          role
          permissionGroups {
            id
            level
            functions
          }
        }
        countyParishHoldings {
          cphNumber
          parish
          startDate
          endDate
          species
          xCoordinate
          yCoordinate
        }
        applications {
          sbi
          id
          subjectId
          year
          name
          moduleCode
          scheme
          statusCodeP
          statusCodeS
          status
          submissionDate
          portalStatusP
          portalStatusS
          portalStatus
          active
          transitionId
          transitionName
          agreementReferences
          transitionHistory {
            id
            name
            timestamp
            checkStatus
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

  v1.get('/authorisation/organisation/organisationId').reply(200, {
    _data: [
      {
        id: 'personId',
        firstName: 'firstName',
        lastName: 'lastName',
        role: 'role',
        customerReference: 'customerReference',
        privileges: ['Full permission - business']
      }
    ]
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

  v1.get('/lms/organisation/organisationId/parcel-details/historic/04-May-25').reply(200, [
    {
      sheetId: 'sheetId',
      parcelId: 'parcelId',
      validFrom: 1636934401682,
      validTo: 1636934392140
    }
  ])

  v1.get(
    '/lms/organisation/organisationId/parcel/sheet-id/sheetId/parcel-id/parcelId/historic/04-May-25/land-covers'
  ).reply(200, {
    features: [
      {
        id: 'id',
        properties: {
          area: 1,
          code: 'code',
          name: 'name',
          isBpsEligible: true
        }
      }
    ]
  })

  v1.get('/lms/organisation/organisationId/covers-summary/historic/04-May-25').reply(200, [
    { name: 'Arable Land', area: 1 },
    { name: 'Permanent Grassland', area: 1 },
    { name: 'Permanent Crops', area: 1 }
  ])

  v1.get('/SitiAgriApi/cv/cphByBusiness/sbi/sbi/list')
    .query(({ pointInTime }) => /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(pointInTime))
    .reply(200, {
      data: [
        {
          sbi: 'mockSbi',
          dt_insert: 'mockDtInsert1',
          dt_delete: 'mockDtDelete1',
          cph_number: 'mockCph1',
          parish: 'mockParish',
          species: 'mockSpecies',
          start_date: '2020-03-20T00:00:00:000+0100',
          end_date: '2021-03-20T00:00:00:000+0100',
          address: 'mockAddress',
          x: 123456,
          y: 654321
        }
      ]
    })

  v1.get('/SitiAgriApi/cv/appByBusiness/sbi/sbi/list').reply(200, {
    data: [
      {
        sbi: 'sbi',
        application_id: 'app123',
        subject_id: '123',
        year: 2025,
        application_name: 'Application Name',
        module_code: 'Module Code',
        scheme: 'Scheme',
        status_code_p: 'Status P',
        status_code_s: 'Status S',
        status: 'Status',
        submission_date: '2025-05-04T02:00:00:123+0100',
        portal_status_p: 'Portal Status P',
        portal_status_s: 'Portal Status S',
        portal_status: 'Portal Status',
        fg_active: 'Yes',
        transition_id: 187,
        transition_name: 'transition name',
        agreement_ref: '42, 17,111',
        application_history: [
          {
            transition_id: 187,
            transition_name: 'Transition Name',
            dt_transition: '2025-05-04T02:00:00:123+0100',
            check_status: 'Check Status'
          }
        ]
      }
    ]
  })
}

describe('Query.business internal', () => {
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
      'auth.disabled': true
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

  test('authenticated external', async () => {
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

    const result = await makeTestQuery(query, {
      'gateway-type': 'external',
      'x-forwarded-authorization': tokenValue
    })

    expect(result).toEqual({
      data: {
        business: {
          organisationId: 'organisationId',
          sbi: 'sbi',
          info: {
            name: 'name',
            address: {
              pafOrganisationName: 'paf organisation name',
              line1: 'line1',
              line2: 'line2',
              line3: 'line3',
              line4: 'line4',
              line5: 'line5',
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
              typeId: 'address type'
            },
            email: { address: 'email address' },
            legalStatus: { code: 101, type: 'legal type' },
            phone: { mobile: 'mobile number', landline: 'landline number' },
            traderNumber: 'trader number',
            type: { code: 101, type: 'business type' },
            vat: 'vat number',
            vendorNumber: 'vendor number'
          },
          land: {
            parcels: [
              {
                id: 'id',
                sheetId: 'sheetId',
                parcelId: 'parcelId',
                area: 0.0001,
                pendingDigitisation: true
              }
            ],
            parcel: {
              id: 'id',
              sheetId: 'sheetId',
              parcelId: 'parcelId',
              area: 0.0001,
              pendingDigitisation: true,
              effectiveToDate: '2021-11-14T23:59:52.140Z',
              effectiveFromDate: '2021-11-15T00:00:01.682Z'
            },
            parcelCovers: [
              { id: 'id', name: 'name', area: 0.0001, code: 'code', isBpsEligible: false }
            ],
            summary: {
              arableLandArea: 0.0001,
              permanentCropsArea: 0.0001,
              permanentGrasslandArea: 0.0001,
              totalArea: 0.0001,
              totalParcels: 1
            }
          },
          customers: [
            {
              personId: 'personId',
              firstName: 'firstName',
              lastName: 'lastName',
              crn: 'customerReference',
              role: 'role'
            }
          ],
          customer: {
            personId: 'personId',
            firstName: 'firstName',
            lastName: 'lastName',
            crn: 'customerReference',
            role: 'role',
            permissionGroups: [
              {
                id: 'BUSINESS_DETAILS',
                level: 'FULL_PERMISSION',
                functions: [
                  'View business details',
                  'View people associated with the business',
                  'Amend business and correspondence contact details',
                  'Amend controlled information, such as business name',
                  'Confirm business details',
                  'Amend bank account details',
                  'Make young/new farmer declaration',
                  'Add someone to the business',
                  'Give permissions on business'
                ]
              }
            ]
          },
          countyParishHoldings: [
            {
              cphNumber: 'mockCph1',
              endDate: '2021-03-20',
              parish: 'mockParish',
              species: 'mockSpecies',
              startDate: '2020-03-20',
              xCoordinate: 123456,
              yCoordinate: 654321
            }
          ],
          applications: [
            {
              sbi: 'sbi',
              id: 'app123',
              subjectId: '123',
              year: 2025,
              name: 'Application Name',
              moduleCode: 'Module Code',
              scheme: 'Scheme',
              statusCodeP: 'Status P',
              statusCodeS: 'Status S',
              status: 'Status',
              submissionDate: '2025-05-04T01:00:00.123Z',
              portalStatusP: 'Portal Status P',
              portalStatusS: 'Portal Status S',
              portalStatus: 'Portal Status',
              active: true,
              transitionId: '187',
              transitionName: 'transition name',
              agreementReferences: ['42', '17', '111'],
              transitionHistory: [
                {
                  id: '187',
                  name: 'Transition Name',
                  timestamp: '2025-05-04T01:00:00.123Z',
                  checkStatus: 'Check Status'
                }
              ]
            }
          ]
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('authenticated internal', async () => {
    const v1 = nock(config.get('kits.internal.gatewayUrl'))
    setupNock(v1)
    mockOrganisationSearch(v1)

    const result = await makeTestQuery(query)

    expect(result).toEqual({
      data: {
        business: {
          organisationId: 'organisationId',
          sbi: 'sbi',
          info: {
            name: 'name',
            address: {
              pafOrganisationName: 'paf organisation name',
              line1: 'line1',
              line2: 'line2',
              line3: 'line3',
              line4: 'line4',
              line5: 'line5',
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
              typeId: 'address type'
            },
            email: { address: 'email address' },
            legalStatus: { code: 101, type: 'legal type' },
            phone: { mobile: 'mobile number', landline: 'landline number' },
            traderNumber: 'trader number',
            type: { code: 101, type: 'business type' },
            vat: 'vat number',
            vendorNumber: 'vendor number'
          },
          land: {
            parcels: [
              {
                id: 'id',
                sheetId: 'sheetId',
                parcelId: 'parcelId',
                area: 0.0001,
                pendingDigitisation: true
              }
            ],
            parcel: {
              id: 'id',
              sheetId: 'sheetId',
              parcelId: 'parcelId',
              area: 0.0001,
              pendingDigitisation: true,
              effectiveToDate: '2021-11-14T23:59:52.140Z',
              effectiveFromDate: '2021-11-15T00:00:01.682Z'
            },
            parcelCovers: [
              { id: 'id', name: 'name', area: 0.0001, code: 'code', isBpsEligible: false }
            ],
            summary: {
              arableLandArea: 0.0001,
              permanentCropsArea: 0.0001,
              permanentGrasslandArea: 0.0001,
              totalArea: 0.0001,
              totalParcels: 1
            }
          },
          customers: [
            {
              personId: 'personId',
              firstName: 'firstName',
              lastName: 'lastName',
              crn: 'customerReference',
              role: 'role'
            }
          ],
          customer: {
            personId: 'personId',
            firstName: 'firstName',
            lastName: 'lastName',
            crn: 'customerReference',
            role: 'role',
            permissionGroups: [
              {
                id: 'BUSINESS_DETAILS',
                level: 'FULL_PERMISSION',
                functions: [
                  'View business details',
                  'View people associated with the business',
                  'Amend business and correspondence contact details',
                  'Amend controlled information, such as business name',
                  'Confirm business details',
                  'Amend bank account details',
                  'Make young/new farmer declaration',
                  'Add someone to the business',
                  'Give permissions on business'
                ]
              }
            ]
          },
          countyParishHoldings: [
            {
              cphNumber: 'mockCph1',
              endDate: '2021-03-20',
              parish: 'mockParish',
              species: 'mockSpecies',
              startDate: '2020-03-20',
              xCoordinate: 123456,
              yCoordinate: 654321
            }
          ],
          applications: [
            {
              sbi: 'sbi',
              id: 'app123',
              subjectId: '123',
              year: 2025,
              name: 'Application Name',
              moduleCode: 'Module Code',
              scheme: 'Scheme',
              statusCodeP: 'Status P',
              statusCodeS: 'Status S',
              status: 'Status',
              submissionDate: '2025-05-04T01:00:00.123Z',
              portalStatusP: 'Portal Status P',
              portalStatusS: 'Portal Status S',
              portalStatus: 'Portal Status',
              active: true,
              transitionId: '187',
              transitionName: 'transition name',
              agreementReferences: ['42', '17', '111'],
              transitionHistory: [
                {
                  id: '187',
                  name: 'Transition Name',
                  timestamp: '2025-05-04T01:00:00.123Z',
                  checkStatus: 'Check Status'
                }
              ]
            }
          ]
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('is able to query land parcels with no date', async () => {
    const v1 = nock(config.get('kits.internal.gatewayUrl'))
    mockOrganisationSearch(v1)
    setupNock(v1)

    const currentDate = new Date()
    const day = currentDate.toLocaleString('en-US', { day: '2-digit' }) // 01
    const month = currentDate.toLocaleString('en-US', { month: 'short' }) // "Sep"
    const year = currentDate.toLocaleString('en-US', { year: '2-digit' }) // "25"
    const formattedDate = `${day}-${month}-${year}`

    v1.get(`/lms/organisation/organisationId/parcels/historic/${formattedDate}`).reply(200, [
      {
        id: 'id',
        sheetId: 'sheetId',
        parcelId: 'parcelId',
        area: 1,
        pendingDigitisation: true
      }
    ])

    v1.get(`/lms/organisation/organisationId/parcel-details/historic/${formattedDate}`).reply(200, [
      {
        sheetId: 'sheetId',
        parcelId: 'parcelId',
        validFrom: 1636934401682,
        validTo: 1636934392140
      }
    ])

    v1.get(
      `/lms/organisation/organisationId/parcel/sheet-id/sheetId/parcel-id/parcelId/historic/${formattedDate}/land-covers`
    ).reply(200, {
      features: [
        {
          id: 'id',
          properties: {
            area: 1,
            code: 'code',
            name: 'name',
            isBpsEligible: true
          }
        }
      ]
    })

    v1.get(`/lms/organisation/organisationId/covers-summary/historic/${formattedDate}`).reply(200, [
      { name: 'Arable Land', area: 1 },
      { name: 'Permanent Grassland', area: 1 },
      { name: 'Permanent Crops', area: 1 }
    ])

    const parcelsQuery = `#graphql
      query BusinessTest {
          business(sbi: "sbi") {
            land {
              parcels {
                id
                sheetId
                parcelId
                area
                pendingDigitisation
              }
              parcel(sheetId: "sheetId", parcelId: "parcelId") {
                id
                sheetId
                parcelId
                area
                pendingDigitisation
                effectiveToDate
                effectiveFromDate
              }
              parcelCovers(sheetId: "sheetId", parcelId: "parcelId") {
                id
                name
                area
                code
                isBpsEligible
              }
              summary {
                arableLandArea
                permanentCropsArea
                permanentGrasslandArea
                totalArea
                totalParcels
              }
            }
          }
        }
      `
    const result = await makeTestQuery(parcelsQuery)
    expect(result).toEqual({
      data: {
        business: {
          land: {
            parcels: [
              {
                id: 'id',
                sheetId: 'sheetId',
                parcelId: 'parcelId',
                area: 0.0001,
                pendingDigitisation: true
              }
            ],
            parcel: {
              id: 'id',
              sheetId: 'sheetId',
              parcelId: 'parcelId',
              area: 0.0001,
              pendingDigitisation: true,
              effectiveToDate: '2021-11-14T23:59:52.140Z',
              effectiveFromDate: '2021-11-15T00:00:01.682Z'
            },
            parcelCovers: [
              {
                id: 'id',
                name: 'name',
                area: 0.0001,
                code: 'code',
                isBpsEligible: false
              }
            ],
            summary: {
              arableLandArea: 0.0001,
              permanentCropsArea: 0.0001,
              permanentGrasslandArea: 0.0001,
              totalArea: 0.0001,
              totalParcels: 1
            }
          }
        }
      }
    })
  })

  test('unauthenticated', async () => {
    configMockPath['auth.disabled'] = false
    const result = await makeTestQuery(query, null, false)

    expect(result.data.business).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
