import { graphql } from 'graphql'
import { Permissions } from '../../../app/data-sources/static/permissions.js'
import { schema } from '../../../app/graphql/server.js'
import {
  transformOrganisationCPH,
  transformOrganisationCPHCoordinates
} from '../../../app/transformers/rural-payments/business-cph.js'
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
import { fakeContext } from '../../test-setup.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationToBusiness
} from '../../../app/transformers/rural-payments/business.js'

const organisationFixture = organisationByOrgId('5565448')._data
const { totalArea, totalParcels } = parcelSummary('5565448')
const organisationCPHInfoFixture = organisationCPHInfo('5565448').data
const organisationCPHFixture = organisationCPH('5565448').data

describe('Query.business', () => {
  it('should return business data', async () => {
    const transformedOrganisation =
      transformOrganisationToBusiness(organisationFixture)

    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "890000001") {
            sbi
            businessId
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
  delete transformedCPH[0].businessId
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
      query BusinessCustomers {
        business(sbi: "890000001") {
          customers {
            customerId
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
              customerId: '5263421',
              firstName: 'Nicholas',
              lastName: 'SANGSTER',
              crn: '9102634220',
              role: 'Business Partner'
            },
            {
              customerId: '5302028',
              firstName: 'Ivan',
              lastName: 'Cook',
              crn: '9103020285',
              role: 'Agent'
            },
            {
              customerId: '5311964',
              firstName: 'Trevor',
              lastName: 'Graham',
              crn: '9103119648',
              role: 'Agent'
            },
            {
              customerId: '5331098',
              firstName: 'Marcus',
              lastName: 'Twigden',
              crn: '9103310984',
              role: 'Agent'
            },
            {
              customerId: '5778203',
              firstName: 'Oliver',
              lastName: 'Colwill',
              crn: '9104760827',
              role: 'Agent'
            }
          ]
        }
      }
    })
  })

  it('permissions', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessCustomersPermissions {
          business(sbi: "890000001") {
            customers {
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
          customers: organisationPeopleByOrgId('5565448')._data.map(
            ({ privileges }) => ({
              permissionGroups:
                transformBusinessCustomerPrivilegesToPermissionGroups(
                  privileges,
                  new Permissions().getPermissionGroups()
                )
            })
          )
        }
      }
    })
  })
})
