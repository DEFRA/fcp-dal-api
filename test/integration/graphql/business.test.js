import { graphql } from 'graphql'
import { schema } from '../../../app/graphql/server.js'
import {
  transformOrganisationCPH,
  transformOrganisationCPHCoordinates
} from '../../../app/transformers/rural-payments-portal/business-cph.js'
import { transformOrganisationToBusiness } from '../../../app/transformers/rural-payments-portal/business.js'
import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels
} from '../../../app/transformers/rural-payments-portal/lms.js'
import { coversSummary, landCovers, landParcels, parcelSummary } from '../../../mocks/fixtures/lms.js'
import { organisationCPH, organisationCPHInfo } from '../../../mocks/fixtures/organisation-cph.js'
import { organisationByOrgId, organisationPeopleByOrgId } from '../../../mocks/fixtures/organisation.js'
import { fakeContext } from '../../test-setup.js'
import { transformPrivilegesListToBusinessCustomerPermissions } from '../../../app/transformers/rural-payments-portal/permissions.js'
import { Permissions } from '../../../app/data-sources/static/permissions.js'

const organisationFixture = organisationByOrgId('123')._data
const { totalArea, totalParcels } = parcelSummary('123')
const organisationCPHInfoFixture = organisationCPHInfo('123').data
const organisationCPHFixture = organisationCPH('123').data

describe('Query.business', () => {
  it('should return business data', async () => {
    const transformedOrganisation = transformOrganisationToBusiness(organisationFixture)

    const result = await graphql({
      source: `#graphql
        query Business {
          business(id: "123") {
            id
            info {
              sbi
              name
              reference
              vat
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
      variableValues: {
        customerId: '5090008'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: JSON.parse(JSON.stringify(transformedOrganisation))
      }
    })
  })
})

describe('Query.business.land', () => {
  it('summary', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandSummary {
          business(id: "123") {
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

    const coversSummaryData = coversSummary(123)

    expect(result).toEqual({
      data: {
        business: {
          land: {
            summary: {
              arableLandArea: transformLandCoversToArea('Arable Land', coversSummaryData),
              permanentCropsArea: transformLandCoversToArea('Permanent Crops', coversSummaryData),
              permanentGrasslandArea: transformLandCoversToArea('Permanent Grassland', coversSummaryData),
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
          business(id: "123") {
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
            parcels: transformLandParcels(landParcels(123))
          }
        }
      }
    })
  })

  it('covers', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandCovers {
          business(id: "5565448") {
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
  const transformedCPH = transformOrganisationCPH('123', organisationCPHFixture)
  delete transformedCPH[0].id

  it('cph', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessCPH {
        business(id: "123") {
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

    expect(result).toEqual({
      data: {
        business: {
          cph: [
            {
              ...transformedCPH[0],
              parish: organisationCPHInfoFixture.parish,
              species: organisationCPHInfoFixture.species,
              startDate: organisationCPHInfoFixture.startDate / 1000,
              expiryDate: organisationCPHInfoFixture.expiryDate / 1000,
              coordinate: transformOrganisationCPHCoordinates(organisationCPHInfoFixture)
            }
          ]
        }
      }
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
        business(id: "123") {
          customers {
            id
            firstName
            lastName
            customerReference
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
              id: '7353104',
              firstName: 'Edgardo',
              lastName: 'Farrell',
              customerReference: '6577447946',
              role: 'Business Partner'
            },
            expect.any(Object),
            expect.any(Object),
            expect.any(Object)
          ]
        }
      }
    })
  })

  it('permissions', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessCustomersPermissions {
          business(id: "BID") {
            customers {
              permissions {
                id
                name
                level
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual(
      {
        data: {
          business: {
            customers: organisationPeopleByOrgId()._data.map(({ privileges }) => ({ permissions: transformPrivilegesListToBusinessCustomerPermissions(privileges, new Permissions().getPermissionGroups()) }))
          }
        }
      }

    )
  })
})
