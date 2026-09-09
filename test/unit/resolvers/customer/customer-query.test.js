import { jest } from '@jest/globals'
import { Query } from '../../../../app/graphql/resolvers/customer/query.js'

describe('Customer Query Resolver', () => {
  let mockDataSources
  let mockLogger

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsCustomer: {
        getPersonIdByCRN: jest.fn(),
        personSearch: jest.fn(),
        validateEmail: jest.fn()
      },
      mongoCustomer: {
        findPersonIdByCRN: jest.fn(),
        upsertPersonIdByCRN: jest.fn()
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

  it('isCustomerEmailRegistered should return true when the email is duplicated', async () => {
    mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
      emailDuplicated: true
    })

    const result = await Query.isCustomerEmailRegistered(
      null,
      { email: 'test@example.com' },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(mockDataSources.ruralPaymentsCustomer.validateEmail).toHaveBeenCalledWith(
      'test@example.com'
    )
    expect(result).toBe(true)
  })

  it('isCustomerEmailRegistered should return false when the email is not duplicated', async () => {
    mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
      emailDuplicated: false
    })

    const result = await Query.isCustomerEmailRegistered(
      null,
      { email: 'test@example.com' },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(result).toBe(false)
  })

  describe('audit trail', () => {
    const info = { path: { key: 'customer', typename: 'Query', prev: undefined } }

    it('customer records the personId and crn as accounts', async () => {
      const crn = '1234567890'
      const auditTrail = { recordAccount: jest.fn() }

      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)

      await Query.customer(null, { crn }, { dataSources: mockDataSources, auditTrail }, info)

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 123)
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', crn)
    })

    it('does not throw when no audit trail is supplied', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)

      await Query.customer(null, { crn: '1234567890' }, { dataSources: mockDataSources })
    })

    it('customerSearch records the crn as an account and an entity when searching by CRN', async () => {
      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      mockDataSources.ruralPaymentsCustomer.personSearch.mockResolvedValue({
        data: [],
        page: { number: 1, size: 20, totalPages: 0, totalElements: 0 }
      })

      await Query.customerSearch(
        null,
        { searchString: '1234567890', searchType: 'CRN', pagination: { page: 1, perPage: 20 } },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', '1234567890')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'search',
        entityid: '1234567890'
      })
    })

    it('isCustomerEmailRegistered records a person entity keyed by email', async () => {
      const auditTrail = { recordEntity: jest.fn() }
      mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
        emailDuplicated: true
      })

      await Query.isCustomerEmailRegistered(
        null,
        { email: 'test@example.com' },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'search',
        entityid: 'test@example.com'
      })
    })

    it('does not record a crn account or an entityid when searching by a non-CRN type', async () => {
      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      mockDataSources.ruralPaymentsCustomer.personSearch.mockResolvedValue({
        data: [],
        page: { number: 1, size: 20, totalPages: 0, totalElements: 0 }
      })

      await Query.customerSearch(
        null,
        {
          searchString: 'Smith',
          searchType: 'CUSTOMER_NAME',
          pagination: { page: 1, perPage: 20 }
        },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).not.toHaveBeenCalled()
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'search'
      })
    })
  })
})
