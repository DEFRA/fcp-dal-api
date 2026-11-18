import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Query } from '../../../../app/graphql/resolvers/customer/query.js'

describe('Customer Query Resolver', () => {
  let mockDataSources
  let mockLogger

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsCustomer: {
        getPersonIdByCRN: vi.fn(),
        personSearch: vi.fn(),
        validateEmail: vi.fn(),
        checkPersonDuplicates: vi.fn()
      },
      mongoCustomer: {
        findPersonIdByCRN: vi.fn(),
        upsertPersonIdByCRN: vi.fn()
      }
    }
  })

  it('customer should return crn and personId when found', async () => {
    const crn = '9234567890'

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
          personalIdentifiers: ['999999999'], // sfd-id-check: allow
          nationalInsuranceNumber: 'AB123456C',
          customerReference: '9234567890',
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
      crn: '9234567890',
      fullName: 'John Smith',
      personalIdentifiers: ['999999999'], // sfd-id-check: allow
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

  describe('customerDuplicate', () => {
    const duplicate = {
      id: 456,
      customerReferenceNumber: '9876543210',
      firstName: 'Jon',
      lastName: 'Doe',
      dateOfBirth: Date.UTC(1980, 5, 10),
      landline: null,
      mobile: '07123456789'
    }

    it('returns the matching customer', async () => {
      mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates.mockResolvedValue(duplicate)

      const result = await Query.customerDuplicate(
        null,
        { input: { first: 'Jon', last: 'Doe', phone: { mobile: '07123456789' } } },
        { dataSources: mockDataSources }
      )

      expect(mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates).toHaveBeenCalledWith({
        id: null,
        firstName: 'Jon',
        lastName: 'Doe',
        dateOfBirth: null,
        landline: null,
        mobile: '07123456789'
      })
      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).not.toHaveBeenCalled()
      expect(result).toEqual({
        crn: '9876543210',
        personId: '456',
        first: 'Jon',
        last: 'Doe',
        dateOfBirth: '1980-06-10',
        phone: { mobile: '07123456789', landline: null }
      })
    })

    it('excludes the customer with the given CRN from the check', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)
      mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates.mockResolvedValue(null)

      await Query.customerDuplicate(
        null,
        { input: { crn: '9123456789', first: 'Jon', last: 'Doe' } },
        { dataSources: mockDataSources }
      )

      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith('9123456789')
      expect(mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates).toHaveBeenCalledWith(
        expect.objectContaining({ id: 123 })
      )
    })

    it('returns null when there is no match', async () => {
      mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates.mockResolvedValue(null)

      const result = await Query.customerDuplicate(
        null,
        { input: { first: 'Jon', last: 'Doe' } },
        { dataSources: mockDataSources }
      )

      expect(result).toBeNull()
    })

    describe('audit trail', () => {
      const info = { path: { key: 'customerDuplicate', typename: 'Query', prev: undefined } }
      let auditTrail

      beforeEach(() => {
        auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      })

      it('records the matching CRN as the entity and as an account', async () => {
        mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)
        mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates.mockResolvedValue(duplicate)

        await Query.customerDuplicate(
          null,
          { input: { crn: '9123456789', first: 'Jon', last: 'Doe' } },
          { dataSources: mockDataSources, auditTrail },
          info
        )

        expect(auditTrail.recordEntity).toHaveBeenCalledExactlyOnceWith(info, {
          entity: 'person',
          action: 'read-duplicate',
          entityid: '9876543210'
        })
        expect(auditTrail.recordAccount).toHaveBeenCalledExactlyOnceWith(info, 'crn', '9876543210')
      })

      it('records the entity without an entityid or account when there is no match', async () => {
        mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates.mockResolvedValue(null)

        await Query.customerDuplicate(
          null,
          { input: { first: 'Jon', last: 'Doe' } },
          { dataSources: mockDataSources, auditTrail },
          info
        )

        expect(auditTrail.recordEntity).toHaveBeenCalledExactlyOnceWith(info, {
          entity: 'person',
          action: 'read-duplicate'
        })
        expect(auditTrail.recordAccount).not.toHaveBeenCalled()
      })

      it('still records the entity when the check fails', async () => {
        const error = new Error('upstream failure')
        mockDataSources.ruralPaymentsCustomer.checkPersonDuplicates.mockRejectedValue(error)

        await expect(
          Query.customerDuplicate(
            null,
            { input: { first: 'Jon', last: 'Doe' } },
            { dataSources: mockDataSources, auditTrail },
            info
          )
        ).rejects.toBe(error)

        expect(auditTrail.recordEntity).toHaveBeenCalledExactlyOnceWith(info, {
          entity: 'person',
          action: 'read-duplicate'
        })
        expect(auditTrail.recordAccount).not.toHaveBeenCalled()
      })
    })
  })

  describe('audit trail', () => {
    const info = { path: { key: 'customer', typename: 'Query', prev: undefined } }

    it('customer records the personId and crn as accounts', async () => {
      const crn = '9234567890'
      const auditTrail = { recordAccount: vi.fn() }

      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)

      await Query.customer(null, { crn }, { dataSources: mockDataSources, auditTrail }, info)

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 123)
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', crn)
    })

    it('still records the crn account when the personId lookup itself fails', async () => {
      const crn = '9234567890'
      const auditTrail = { recordAccount: vi.fn() }

      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(null)
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('upstream failure')
      )

      await expect(
        Query.customer(null, { crn }, { dataSources: mockDataSources, auditTrail }, info)
      ).rejects.toThrow('upstream failure')

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', crn)
      expect(auditTrail.recordAccount).not.toHaveBeenCalledWith(info, 'personId', expect.anything())
    })

    it('does not throw when no audit trail is supplied', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(123)

      await Query.customer(null, { crn: '9234567890' }, { dataSources: mockDataSources })
    })

    it('customerSearch records the crn as an account and an entity when searching by CRN', async () => {
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      mockDataSources.ruralPaymentsCustomer.personSearch.mockResolvedValue({
        data: [],
        page: { number: 1, size: 20, totalPages: 0, totalElements: 0 }
      })

      await Query.customerSearch(
        null,
        { searchString: '9234567890', searchType: 'CRN', pagination: { page: 1, perPage: 20 } },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', '9234567890')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'search',
        entityid: '9234567890'
      })
    })

    it('isCustomerEmailRegistered records a person entity keyed by email', async () => {
      const auditTrail = { recordEntity: vi.fn() }
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
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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
