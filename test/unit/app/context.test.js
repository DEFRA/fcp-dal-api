import { describe, expect, jest } from '@jest/globals'

const getAuthMock = jest.fn()
const getRequestingGroupMock = jest.fn()
const PermissionsMock = jest.fn()
const RuralPaymentsBusinessMock = jest.fn()
const RuralPaymentsCustomerMock = jest.fn()
const MongoCustomerMock = jest.fn()
const MongoBusinessMock = jest.fn()
const MongoJWKSMock = jest.fn()
const loggerChild = jest.fn()
const loggerMock = { child: loggerChild }

jest.unstable_mockModule('../../../app/auth/authenticate.js', () => ({
  getAuth: getAuthMock,
  getRequestingGroup: getRequestingGroupMock
}))
jest.unstable_mockModule('../../../app/data-sources/static/permissions.js', () => ({
  Permissions: PermissionsMock
}))
jest.unstable_mockModule(
  '../../../app/data-sources/rural-payments/RuralPaymentsBusiness.js',
  () => ({
    RuralPaymentsBusiness: RuralPaymentsBusinessMock
  })
)
jest.unstable_mockModule(
  '../../../app/data-sources/rural-payments/RuralPaymentsCustomer.js',
  () => ({
    RuralPaymentsCustomer: RuralPaymentsCustomerMock
  })
)
jest.unstable_mockModule('../../../app/data-sources/mongo/Business.js', () => ({
  MongoBusiness: MongoBusinessMock
}))
jest.unstable_mockModule('../../../app/data-sources/mongo/Customer.js', () => ({
  MongoCustomer: MongoCustomerMock
}))
jest.unstable_mockModule('../../../app/data-sources/mongo/JWKS.js', () => ({
  MongoJWKS: MongoJWKSMock
}))
jest.unstable_mockModule('../../../app/logger/logger.js', () => ({
  logger: loggerMock
}))
const { context } = await import('../../../app/graphql/context.js')

describe('context', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should build context with correct properties', async () => {
    getAuthMock.mockResolvedValue({ user: 'test-user' })
    PermissionsMock.mockImplementation(() => ({ type: 'Permissions' }))
    MongoJWKSMock.mockImplementation(() => ({}))
    loggerChild.mockReturnValue({ log: jest.fn() })
    const request = {
      headers: {
        'gateway-type': 'external',
        'x-forwarded-authorization': 'token123'
      },
      transactionId: 'tx-1',
      traceId: 'trace-1'
    }

    const result = await context({ request })

    expect(getAuthMock).toHaveBeenCalledWith(request, MongoJWKSMock())
    expect(loggerMock.child).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      traceId: 'trace-1'
    })
    expect(result.auth).toEqual({ user: 'test-user' })
    expect(result.requestLogger).toBeDefined()
    expect(result.dataSources.permissions.type).toBe('Permissions')
    expect(result.dataSources.ruralPaymentsBusiness).toEqual({})
    expect(result.dataSources.ruralPaymentsCustomer).toEqual({})
    expect(result.dataSources.mongoBusiness).toEqual({})
    expect(result.dataSources.mongoCustomer).toEqual({})
  })

  describe('hitachiPayments', () => {
    test('Audit requesterId is extracted from request email header', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: {
          email: 'email@example.com'
        }
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.requesterId).toBe('email@example.com')
    })

    test('Audit requesterId is undefined if no email header found', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: {}
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.requesterId).toBeUndefined()
    })

    test('Audit correlationId is extracted from request traceId', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: {},
        traceId: '111-222-333'
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.correlationId).toBe('111-222-333')
    })

    test('Audit correlationId is undefined if no request traceId is found', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: {}
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.correlationId).toBeUndefined()
    })

    test('Audit requestedSystem is extracted from requesting group response', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user', groups: ['group-1', 'group-2'] })
      getRequestingGroupMock.mockReturnValue('SOME_AD_GROUP')
      const request = {
        headers: {},
        traceId: '111-222-333'
      }

      const result = await context({ request })

      expect(getRequestingGroupMock).toHaveBeenCalledWith(['group-1', 'group-2'])
      expect(result.dataSources.hitachiPayments.audit.requestedSystem).toBe('SOME_AD_GROUP')
    })

    test('Audit requestedSystem is undefined if no requesting group returned', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      getRequestingGroupMock.mockReturnValue(undefined)
      const request = {
        headers: {},
        traceId: '111-222-333'
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.requestedSystem).toBeUndefined()
    })
  })
})
