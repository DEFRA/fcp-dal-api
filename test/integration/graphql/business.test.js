import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { fakeContext } from '../../test-setup.js'

import { transformOrganisationToBusiness } from '../../../app/transformers/rural-payments-portal/business.js'
import { organisation as organisationFixture } from '../../../mocks/fixtures/organisation.js'
import { landCovers, totalArea, totalParcels, coversSummary, landParcels } from '../../../mocks/fixtures/lms.js'
import { transformLandCovers, transformLandCoversToArea, transformLandParcels } from '../../../app/transformers/rural-payments-portal/lms.js'
import {
  organisationCPHInfo as organisationCPHInfoFixture,
  organisationCPH as organisationCPHFixture
} from '../../../mocks/fixtures/organisation-cph.js'
import {
  transformOrganisationCPH,
  transformOrganisationCPHCoordinates
} from '../../../app/transformers/rural-payments-portal/business-cph.js'

describe('Query.business', () => {
  it('should return business data', async () => {
    const transformedOrganisation = transformOrganisationToBusiness(organisationFixture)

    const result = await graphql({
      source: `#graphql
        query Business {
          business(id: "5444918") {
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
          business(id: "ID") {
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

    expect(result).toEqual({
      data: {
        business: {
          land: {
            summary: {
              arableLandArea: transformLandCoversToArea('Arable Land', coversSummary),
              permanentCropsArea: transformLandCoversToArea('Permanent Crops', coversSummary),
              permanentGrasslandArea: transformLandCoversToArea('Permanent Grassland', coversSummary),
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
          business(id: "ID") {
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
            parcels: transformLandParcels(landParcels)
          }
        }
      }
    })
  })

  it('covers', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessLandCovers {
          business(id: "ID") {
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
            covers: transformLandCovers(landCovers)
          }
        }
      }
    })
  })
})

describe('Query.Business.cph', () => {
  const transformedCPH = transformOrganisationCPH('ID', organisationCPHFixture)
  delete transformedCPH[0].id

  it('cph', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessCPH {
        business(id: "ID") {
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
              startDate: organisationCPHInfoFixture.startDate,
              expiryDate: organisationCPHInfoFixture.expiryDate,
              coordinate: transformOrganisationCPHCoordinates(
                organisationCPHInfoFixture
              )
            }
          ]
        }
      }
    })
  })
})
