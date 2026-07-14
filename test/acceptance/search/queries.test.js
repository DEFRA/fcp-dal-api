import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const businessSearchQuery = gql`
  query BusinessSearch(
    $searchString: String!
    $searchType: BusinessSearchFieldType!
    $pagination: Pagination
  ) {
    businessSearch(searchString: $searchString, searchType: $searchType, pagination: $pagination) {
      results {
        organisationId
        sbi
        name
        additionalSbis
        isFinancialToBusinessAddress
        isCorrespondenceAsBusinessAddress
        landConfirmed
        lastUpdated
        status {
          locked
          confirmed
          deactivated
        }
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
        correspondenceAddress {
          line1
          postalCode
        }
      }
      pageInfo {
        number
        size
        totalPages
        totalElements
      }
    }
  }
`

const customerSearchQuery = gql`
  query CustomerSearch(
    $searchString: String!
    $searchType: CustomerSearchFieldType!
    $pagination: Pagination
  ) {
    customerSearch(searchString: $searchString, searchType: $searchType, pagination: $pagination) {
      results {
        personId
        crn
        fullName
        personalIdentifiers
        nationalInsuranceNumber
        email
        status {
          locked
          confirmed
          deactivated
        }
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
      }
      pageInfo {
        number
        size
        totalPages
        totalElements
      }
    }
  }
`

describe('Business Search Queries', () => {
  it('should return a business when searching by SBI - internal', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      businessSearchQuery,
      { searchString: '111111111', searchType: 'SBI' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.businessSearch).toEqual({
      results: [
        {
          organisationId: '111111111',
          sbi: '111111111',
          name: 'Bechtelar - Stamm',
          additionalSbis: [],
          isFinancialToBusinessAddress: true,
          isCorrespondenceAsBusinessAddress: false,
          landConfirmed: true,
          lastUpdated: '2024-12-31T22:48:44.689Z',
          status: {
            locked: false,
            confirmed: false,
            deactivated: false
          },
          address: {
            pafOrganisationName: 'Bechtelar - Stamm',
            line1: '98',
            line2: '8 Gutmann Rise',
            line3: 'North Cormier Park',
            line4: 'GK0 0XW',
            line5: 'Norfolk Island',
            buildingNumberRange: null,
            buildingName: null,
            flatName: null,
            street: null,
            city: 'Fisher Court',
            county: null,
            postalCode: 'HS26 53S',
            country: 'Scotland',
            uprn: '415400139912',
            dependentLocality: null,
            doubleDependentLocality: null,
            typeId: null
          },
          correspondenceAddress: null
        }
      ],
      pageInfo: {
        number: 0,
        size: 100,
        totalPages: 1,
        totalElements: 1
      }
    })
  })

  it('should return no results for an unknown SBI', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      businessSearchQuery,
      { searchString: '999999999', searchType: 'SBI' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.businessSearch.results).toEqual([])
    expect(response.businessSearch.pageInfo.totalElements).toEqual(0)
  })
})

describe('Customer Search Queries', () => {
  it('should return a customer when searching by CRN - internal', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      customerSearchQuery,
      { searchString: '1111111100', searchType: 'CRN' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.customerSearch).toEqual({
      results: [
        {
          personId: '11111111',
          crn: '1111111100',
          fullName: 'Raul Feil',
          personalIdentifiers: ['2363710898', '7209755783'],
          nationalInsuranceNumber: null,
          email: 'raul.feil@questionable-millet.uk',
          status: {
            locked: false,
            confirmed: false,
            deactivated: true
          },
          address: {
            pafOrganisationName: null,
            line1: '681',
            line2: '7 Tito Wood',
            line3: 'South Yundtington',
            line4: 'JT0 2WK',
            line5: 'Mozambique',
            buildingNumberRange: null,
            buildingName: null,
            flatName: null,
            street: null,
            city: "Bode-Gorczany-under-O'Kon-Ebert",
            county: null,
            postalCode: 'E3G 7YZ',
            country: 'Wales',
            uprn: '078329933641',
            dependentLocality: null,
            doubleDependentLocality: null,
            typeId: null
          }
        }
      ],
      pageInfo: {
        number: 0,
        size: 100,
        totalPages: 1,
        totalElements: 1
      }
    })
  })

  it('should return no results for an unknown CRN', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      customerSearchQuery,
      { searchString: '9999999999', searchType: 'CRN' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.customerSearch.results).toEqual([])
    expect(response.customerSearch.pageInfo.totalElements).toEqual(0)
  })
})
