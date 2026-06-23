import { jest } from '@jest/globals'
import { Query } from '../../../../app/graphql/resolvers/customer/query.js'

describe('Customer Query Resolver', () => {
  let mockDataSources
  let mockLogger

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsCustomer: {
        getPersonIdByCRN: jest.fn(),
        personSearch: jest.fn()
      },
      mongoCustomer: {
        findPersonIdByCRN: jest.fn(),
        insertPersonIdByCRN: jest.fn()
      }
    }
  })

  it('customer should return crn and personId when found', async () => {
    const crn = '1234567890'

    mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)

    const result = await Query.customer(
      null,
      { crn },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(mockDataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(result).toEqual({ crn, personId: 123 })
  })

  it('customerSearch should return transformed results and page info', async () => {
    const page = { number: 1, size: 20, totalPages: 1, totalElements: 1 }
    mockDataSources.ruralPaymentsCustomer.personSearch.mockResolvedValue({
      data: [
        {
          id: 123,
          fullName: 'John Smith',
          primaryAddress: { address1: 'line 1', postalCode: 'AB12 3CD' },
          personalIdentifiers: ['116172867'],
          nationalInsuranceNumber: 'AB123456C',
          customerReference: '1234567890',
          email: 'john.smith@example.com',
          locked: false,
          deactivated: false
        }
      ],
      page
    })

    const result = await Query.customerSearch(
      null,
      {
        searchString: 'Smith',
        searchType: 'CUSTOMER_NAME',
        pagination: { page: 1, perPage: 20 }
      },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(mockDataSources.ruralPaymentsCustomer.personSearch).toHaveBeenCalledWith(
      'CUSTOMER_NAME',
      'Smith',
      { page: 1, perPage: 20 }
    )
    expect(result.pageInfo).toEqual(page)
    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toMatchObject({
      personId: '123',
      crn: '1234567890',
      fullName: 'John Smith',
      personalIdentifiers: ['116172867'],
      nationalInsuranceNumber: 'AB123456C',
      email: 'john.smith@example.com',
      status: { locked: false, deactivated: false, confirmed: false }
    })
    expect(result.results[0].address).toMatchObject({
      line1: 'line 1',
      postalCode: 'AB12 3CD'
    })
  })
})
