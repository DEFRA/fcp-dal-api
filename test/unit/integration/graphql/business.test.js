import { graphql, GraphQLError } from 'graphql'
import { Permissions } from '../../../../app/data-sources/static/permissions.js'
import { NotFound } from '../../../../app/errors/graphql.js'
import { schema } from '../../../../app/graphql/server.js'
import {
  transformCPHInfo,
  transformOrganisationCPH
} from '../../../../app/transformers/rural-payments/business-cph.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationToBusiness
} from '../../../../app/transformers/rural-payments/business.js'
import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels
} from '../../../../app/transformers/rural-payments/lms.js'
import { coversSummary, landCover, landParcels } from '../../../../mocks/fixtures/lms.js'
import {
  organisationCPH,
  organisationCPHInfo
} from '../../../../mocks/fixtures/organisation-cph.js'
import {
  organisationByOrgId,
  organisationPeopleByOrgId
} from '../../../../mocks/fixtures/organisation.js'
import mockServer from '../../../../mocks/server'
import { fakeContext } from '../../../test-setup.js'

const organisationFixture = organisationByOrgId('5565448')._data
const organisationCPHInfoFixture = organisationCPHInfo('5565448').data
const organisationCPHFixture = organisationCPH('5565448').data

beforeAll(mockServer.start)
afterAll(mockServer.stop)

describe('Query.business', () => {
  afterEach(async () => {
    await mockServer.server.mock.restoreRouteVariants()
  })

  it('should return business data', async () => {
    const transformedOrganisation = transformOrganisationToBusiness(organisationFixture)

    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "107183280") {
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
      errors: [new NotFound('Rural payments organisation not found')]
    })
  })

  it('should handle error from rpp', async () => {
    await mockServer.server.mock.useRouteVariant('rural-payments-organisation-get-by-id:rpp-error')

    const result = await graphql({
      source: `#graphql
          query Business {
            business(sbi: "107183280") {
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

  it('should handle missing address', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-organisation-get-by-id:missing-address'
    )

    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "107183280") {
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

    expect(result.data.business.info.address.pafOrganisationName).toBeNull()
  })
})

describe('Query.business.land', () => {
  it('summary', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandSummary {
          business(sbi: "107183280") {
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
              arableLandArea: transformLandCoversToArea('Arable Land', coversSummaryData),
              permanentCropsArea: transformLandCoversToArea('Permanent Crops', coversSummaryData),
              permanentGrasslandArea: transformLandCoversToArea(
                'Permanent Grassland',
                coversSummaryData
              ),
              totalArea: 821.1645,
              totalParcels: 302
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
          business(sbi: "107183280") {
            land {
              parcels(date: "2021-01-01") {
                id
                sheetId,
                parcelId,
                area,
                pendingDigitisation
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

  it('handles invalidate date for parcels', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandCovers {
          business(sbi: "107183280") {
            land {
              parcels(date: "2020/20/01") {
                id
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
            parcels: null
          }
        }
      },
      errors: [
        new GraphQLError(
          'Invalid date format: "2020/20/01" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01'
        )
      ]
    })
  })

  it('parcel', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandParcels {
          business(sbi: "107183280") {
            land {
              parcel(date: "2021-01-01", sheetId: "SS6927", parcelId: "8194") {
                id
                sheetId,
                parcelId,
                area,
                pendingDigitisation,
                effectiveToDate,
                effectiveFromDate
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    const parcels = transformLandParcels(landParcels(5565448))
    const parcel = parcels.find(
      (parcel) => parcel.sheetId === 'SS6927' && parcel.parcelId === '8194'
    )

    expect(result).toEqual({
      data: {
        business: {
          land: {
            parcel: {
              ...parcel,
              effectiveFromDate: '2021-11-15T00:00:01.682Z',
              effectiveToDate: '2021-11-14T23:59:52.140Z'
            }
          }
        }
      }
    })
  })

  it('handles parcel not found', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandParcels {
          business(sbi: "107183280") {
            land {
              parcel(date: "2021-01-01", sheetId: "SS6927", parcelId: "9999") {
                id
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
            parcel: null
          }
        }
      },
      errors: [new GraphQLError('No parcel found for sheetId: SS6927 and parcelId: 9999')]
    })
  })

  it('handles invalidate date for parcel', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandParcels {
          business(sbi: "107183280") {
            land {
              parcel(date: "2020/20/01", sheetId: "SS6927", parcelId: "8194") {
                id
                sheetId,
                parcelId,
                area,
                pendingDigitisation
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
            parcel: null
          }
        }
      },
      errors: [
        new GraphQLError(
          'Invalid date format: "2020/20/01" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01'
        )
      ]
    })
  })

  it('covers', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandCovers {
          business(sbi: "107183280") {
            land {
              parcelCovers(date: "2022-01-01", sheetId: "SS6927", parcelId: "8194") {
                id
                name
                area
                code
                isBpsEligible
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
            parcelCovers: transformLandCovers(landCover('5565448', 'SS6927', '8194'))
          }
        }
      }
    })
  })

  it('handles invalidate date for parcel covers', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandCovers {
          business(sbi: "107183280") {
            land {
              parcelCovers(date: "2020/20/01", sheetId: "SS6927", parcelId: "8194") {
                id
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
            parcelCovers: null
          }
        }
      },
      errors: [
        new GraphQLError(
          'Invalid date format: "2020/20/01" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01'
        )
      ]
    })
  })
})

describe('Query.business.cphs', () => {
  it('cphs', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessCPHs {
          business(sbi: "107183280") {
            cphs {
              number
              parcelNumbers
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result.data.business.cphs).toEqual(
      transformOrganisationCPH('5565448', organisationCPHFixture)
    )
  })
})

describe('Query.business.cph', () => {
  it('cph', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessCPH {
        business(sbi: "107183280") {
          cph(number: "10/327/0023") {
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

    expect(result.data.business.cph).toEqual(
      transformCPHInfo('10/327/0023', organisationCPHFixture, organisationCPHInfoFixture)
    )
  })
})

describe('Query.business.customers', () => {
  const transformedCPH = transformOrganisationCPH('123', organisationCPHFixture)
  delete transformedCPH[0].id

  it('customer', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessCustomer {
        business(sbi: "107183280") {
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
              crn: '1638563942',
              role: 'Business Partner'
            },
            {
              personId: '5302028',
              firstName:
                'Ingrid Jerimire Klaufichus Limouhetta Mortimious Neuekind Orpheus Perimillian Quixillotrio Reviticlese',
              lastName: 'Cook',
              crn: '9477368292',
              role: 'Agent'
            },
            {
              personId: '5311964',
              firstName: 'Trevor',
              lastName: 'Graham',
              crn: '2446747270',
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
          business(sbi: "107183280") {
            customer(crn: "9477368292") {
              permissionGroups {
                id
                level
                functions
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
          customer: organisationPeopleByOrgId('5565448')
            ._data.filter((person) => person.id === personId)
            .map(({ privileges }) => ({
              permissionGroups: transformBusinessCustomerPrivilegesToPermissionGroups(
                privileges,
                new Permissions().getPermissionGroups()
              )
            }))[0]
        }
      }
    })
  })
})
