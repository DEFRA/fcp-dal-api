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
        numberOfElements
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
        numberOfElements
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
      { searchString: '1111111111', searchType: 'SBI' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.businessSearch).toEqual({
      results: [
        {
          organisationId: '1111111111',
          sbi: '1111111111',
          name: 'Maggio, Murray and Dicki',
          additionalSbis: [],
          isFinancialToBusinessAddress: false,
          isCorrespondenceAsBusinessAddress: false,
          landConfirmed: true,
          lastUpdated: '2024-12-31T23:45:32.357Z',
          status: {
            locked: false,
            confirmed: true,
            deactivated: false
          },
          address: {
            pafOrganisationName: 'Maggio, Murray and Dicki',
            line1: '14',
            line2: '16 Fourth Avenue',
            line3: 'Miller-under-Raynor',
            line4: 'XP0 6TX',
            line5: 'Saint Helena',
            buildingNumberRange: null,
            buildingName: null,
            flatName: null,
            street: null,
            city: 'South Witting Green',
            county: null,
            postalCode: 'IH1 1MM',
            country: 'England',
            uprn: '563449849116',
            dependentLocality: null,
            doubleDependentLocality: null,
            typeId: null
          },
          correspondenceAddress: null
        }
      ],
      pageInfo: {
        number: 0,
        size: 20,
        totalPages: 1,
        numberOfElements: 1,
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
    expect(response.businessSearch.pageInfo.numberOfElements).toEqual(0)
    expect(response.businessSearch.pageInfo.totalElements).toEqual(0)
  })
})

describe('Customer Search Queries', () => {
  it('should return a customer when searching by CUSTOMER_REFERENCE - internal', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      customerSearchQuery,
      { searchString: '1111111100', searchType: 'CUSTOMER_REFERENCE' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.customerSearch).toEqual({
      results: [
        {
          personId: '11111111',
          crn: '1111111100',
          fullName: 'Lauren Sanford',
          personalIdentifiers: ['8568845789', '370030956', '7899566034'],
          nationalInsuranceNumber: null,
          email: 'lauren.sanford@immaculate-shark.info',
          status: {
            locked: false,
            confirmed: false,
            deactivated: false
          },
          address: {
            pafOrganisationName: null,
            line1: '65',
            line2: '1 McCullough Path',
            line3: 'Newton Ratkedon',
            line4: 'MS9 8BJ',
            line5: 'North Macedonia',
            buildingNumberRange: null,
            buildingName: null,
            flatName: null,
            street: null,
            city: 'Newton Bruen',
            county: null,
            postalCode: 'TC2 8KP',
            country: 'Wales',
            uprn: '790214962932',
            dependentLocality: null,
            doubleDependentLocality: null,
            typeId: null
          }
        }
      ],
      pageInfo: {
        number: 0,
        size: 20,
        totalPages: 1,
        numberOfElements: 1,
        totalElements: 1
      }
    })
  })

  it('should return no results for an unknown CRN', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      customerSearchQuery,
      { searchString: '9999999999', searchType: 'CUSTOMER_REFERENCE' },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.customerSearch.results).toEqual([])
    expect(response.customerSearch.pageInfo.numberOfElements).toEqual(0)
    expect(response.customerSearch.pageInfo.totalElements).toEqual(0)
  })
})
