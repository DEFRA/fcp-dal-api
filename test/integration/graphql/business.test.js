import { graphql, GraphQLError } from 'graphql'
import { Permissions } from '../../../app/data-sources/static/permissions.js'
import { NotFound } from '../../../app/errors/graphql.js'
import { schema } from '../../../app/graphql/server.js'
import {
  transformOrganisationCPH,
  transformOrganisationCPHCoordinates
} from '../../../app/transformers/rural-payments/business-cph.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationToBusiness
} from '../../../app/transformers/rural-payments/business.js'
import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels
} from '../../../app/transformers/rural-payments/lms.js'
import {
  coversSummary,
  landCovers,
  landParcels,
  parcelSummary
} from '../../../mocks/fixtures/lms.js'
import {
  organisationCPH,
  organisationCPHInfo
} from '../../../mocks/fixtures/organisation-cph.js'
import {
  organisationByOrgId,
  organisationPeopleByOrgId
} from '../../../mocks/fixtures/organisation.js'
import mockServer from '../../../mocks/server'
import { fakeContext } from '../../test-setup.js'

const organisationFixture = organisationByOrgId('5565448')._data
const { totalArea, totalParcels } = parcelSummary('5565448')
const organisationCPHInfoFixture = organisationCPHInfo('5565448').data
const organisationCPHFixture = organisationCPH('5565448').data

beforeAll(mockServer.start)
afterAll(mockServer.stop)

describe('Query.business', () => {
  afterEach(async () => {
    await mockServer.server.mock.restoreRouteVariants()
  })

  it('should return business data', async () => {
    const transformedOrganisation =
      transformOrganisationToBusiness(organisationFixture)

    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "890000001") {
            sbi
            organisationId
            info {
              name
              reference
              vat
              traderNumber
              vendorNumber
              address {
                pafOrganisationName
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
              phone {
                mobile
                landline
                fax
              }
              email {
                address
                validated
                doNotContact
              }
              legalStatus {
                code
                type
              }
              type {
                code
                type
              }
              registrationNumbers {
                companiesHouse
                charityCommission
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: transformedOrganisation
      }
    })
  })

  it('should return NOT_FOUND if business not found', async () => {
    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "XXX") {
            sbi
            organisationId
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: { business: null },
      errors: [
        new NotFound('Rural payments organisation not found')
      ]
    })
  })

  it('should handle error from rpp', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-organisation-get-by-id:rpp-error'
    )

    const result = await graphql({
      source: `#graphql
          query Business {
            business(sbi: "890000001") {
              sbi
              organisationId
            }
          }
        `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: { business: null },
      errors: [new GraphQLError('Internal Server Error')]
    })
  })

  it('should handle error from apim', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-organisation-get-by-id:apim-error'
    )

    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "890000001") {
            sbi
            organisationId
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: { business: null },
      errors: [new GraphQLError('Internal Server Error')]
    })
  })
})

describe('Query.business.land', () => {
  it('summary', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandSummary {
          business(sbi: "890000001") {
            land {
              summary {
                totalParcels
                totalArea
                arableLandArea
                permanentCropsArea
                permanentGrasslandArea
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    const coversSummaryData = coversSummary(5565448)

    expect(result).toEqual({
      data: {
        business: {
          land: {
            summary: {
              arableLandArea: transformLandCoversToArea(
                'Arable Land',
                coversSummaryData
              ),
              permanentCropsArea: transformLandCoversToArea(
                'Permanent Crops',
                coversSummaryData
              ),
              permanentGrasslandArea: transformLandCoversToArea(
                'Permanent Grassland',
                coversSummaryData
              ),
              totalArea,
              totalParcels
            }
          }
        }
      }
    })
  })

  it('parcels', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandParcels {
          business(sbi: "890000001") {
            land {
              parcels {
                id
                sheetId
                area
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: {
          land: {
            parcels: transformLandParcels(landParcels(5565448))
          }
        }
      }
    })
  })

  it('covers', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandCovers {
          business(sbi: "890000001") {
            land {
              covers {
                id
                name
                area
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: {
          land: {
            covers: transformLandCovers(landCovers('5565448'))
          }
        }
      }
    })
  })
})

describe('Query.business.cph', () => {
  const transformedCPH = transformOrganisationCPH(
    '5565448',
    organisationCPHFixture
  )
  delete transformedCPH[0].organisationId
  it('cph', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessCPH {
        business(sbi: "890000001") {
          cph {
            number
            parcelNumbers
            parish
            startDate
            expiryDate
            species
            coordinate {
              x
              y
            }
          }
        }
      }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result.data.business.cph[0]).toEqual({
      ...transformedCPH[0],
      parish: organisationCPHInfoFixture.parish,
      species: organisationCPHInfoFixture.species,
      startDate: organisationCPHInfoFixture.startDate / 1000,
      expiryDate: organisationCPHInfoFixture.expiryDate / 1000,
      coordinate: transformOrganisationCPHCoordinates(
        organisationCPHInfoFixture
      )
    })
  })
})

describe('Query.business.customers', () => {
  const transformedCPH = transformOrganisationCPH('123', organisationCPHFixture)
  delete transformedCPH[0].id

  it('customer', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessCustomer {
        business(sbi: "890000001") {
          customers {
            personId
            firstName
            lastName
            crn
            role
          }
        }
      }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: {
          customers: [
            {
              personId: '5263421',
              firstName: 'Nicholas',
              lastName: 'SANGSTER',
              crn: '9638563942',
              role: 'Business Partner'
            },
            {
              personId: '5302028',
              firstName: 'Ingrid Jerimire Klaufichus Limouhetta Mortimious Neuekind Orpheus Perimillian Quixillotrio Reviticlese',
              lastName: 'Cook',
              crn: '9477368292',
              role: 'Agent'
            },
            {
              personId: '5311964',
              firstName: 'Trevor',
              lastName: 'Graham',
              crn: '9446747270',
              role: 'Agent'
            },
            {
              personId: '5331098',
              firstName: 'Marcus',
              lastName: 'Twigden',
              crn: '4804081228',
              role: 'Agent'
            },
            {
              personId: '5778203',
              firstName: 'Oliver',
              lastName: 'Colwill',
              crn: '6148241575',
              role: 'Agent'
            }
          ]
        }
      }
    })
  })

  it('permissions', async () => {
    const personId = 5302028
    const result = await graphql({
      source: `#graphql
        query BusinessCustomerPermissions {
          business(sbi: "890000001") {
            customer(crn: "9477368292") {
              permissionGroups {
                id
                level
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: {
          customer: organisationPeopleByOrgId('5565448')._data.filter(person => person.id === personId).map(
            ({ privileges }) => ({
              permissionGroups:
                transformBusinessCustomerPrivilegesToPermissionGroups(
                  privileges,
                  new Permissions().getPermissionGroups()
                )
            })
          )[0]
        }
      }
    })
  })
})
