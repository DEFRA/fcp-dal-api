import { describe, expect, jest } from '@jest/globals'
import { config } from '../../../app/config.js'

const getAuthMock = jest.fn()
const getRequestingGroupMock = jest.fn()
const getRequestingServiceMock = jest.fn()
const PermissionsMock = jest.fn()
const RuralPaymentsBusinessMock = jest.fn()
const RuralPaymentsCustomerMock = jest.fn()
const MongoCustomerMock = jest.fn()
const MongoBusinessMock = jest.fn()
const JWKSMock = jest.fn()
const loggerChild = jest.fn()
const loggerMock = { child: loggerChild }

jest.unstable_mockModule('../../../app/auth/authenticate.js', () => ({
  getAuth: getAuthMock,
  getRequestingGroup: getRequestingGroupMock,
  getRequestingService: getRequestingServiceMock
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
jest.unstable_mockModule('../../../app/data-sources/JWKS.js', () => ({
  JWKS: JWKSMock
}))
jest.unstable_mockModule('../../../app/logger/logger.js', () => ({
  logger: loggerMock
}))
const { context } = await import('../../../app/graphql/context.js')

describe('context', () => {
  beforeEach(() => {
    RuralPaymentsBusinessMock.mockImplementation(() => ({ isExternalRoute: () => false }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should build context with correct properties', async () => {
    getAuthMock.mockResolvedValue({ user: 'test-user' })
    PermissionsMock.mockImplementation(() => ({ type: 'Permissions' }))
    JWKSMock.mockImplementation(() => ({}))
    loggerChild.mockReturnValue({ log: jest.fn() })
    const request = {
      headers: {
        'x-forwarded-authorization': 'token123'
      },
      transactionId: 'tx-1',
      traceId: 'trace-1'
    }

    const result = await context({ request })

    expect(getAuthMock).toHaveBeenCalledWith(request, JWKSMock())
    expect(loggerMock.child).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      traceId: 'trace-1'
    })
    expect(result.auth).toEqual({ user: 'test-user' })
    expect(result.request).toBe(request)
    expect(result.requestLogger).toBeDefined()
    expect(result.auditTrail).toBeDefined()
    expect(result.dataSources.permissions.type).toBe('Permissions')
    expect(result.dataSources.ruralPaymentsBusiness).toBeDefined()
    expect(result.dataSources.ruralPaymentsCustomer).toEqual({})
    expect(result.dataSources.mongoBusiness).toEqual({})
    expect(result.dataSources.mongoCustomer).toEqual({})
    expect(result.dataSources.serviceAccount.ruralPaymentsBusiness).toBeNull()
  })

  test('binds the requesting service onto the request logger and the request itself, when one is identified', async () => {
    getAuthMock.mockResolvedValue({ user: 'test-user', groups: ['some-group'] })
    getRequestingServiceMock.mockReturnValue('Grants')
    PermissionsMock.mockImplementation(() => ({ type: 'Permissions' }))
    JWKSMock.mockImplementation(() => ({}))
    loggerChild.mockReturnValue({ log: jest.fn() })
    const request = {
      headers: { 'x-forwarded-authorization': 'token123' },
      transactionId: 'tx-1',
      traceId: 'trace-1'
    }

    await context({ request })

    expect(getRequestingServiceMock).toHaveBeenCalledWith(['some-group'])
    expect(loggerMock.child).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      traceId: 'trace-1',
      tenant: { id: 'Grants' }
    })
    expect(request.requestingService).toBe('Grants')
  })

  test('omits tenant from the request logger bindings when no requesting service is identified', async () => {
    getAuthMock.mockResolvedValue({ user: 'test-user' })
    getRequestingServiceMock.mockReturnValue(null)
    PermissionsMock.mockImplementation(() => ({ type: 'Permissions' }))
    JWKSMock.mockImplementation(() => ({}))
    loggerChild.mockReturnValue({ log: jest.fn() })
    const request = {
      headers: { 'x-forwarded-authorization': 'token123' },
      transactionId: 'tx-1',
      traceId: 'trace-1'
    }

    await context({ request })

    expect(getRequestingServiceMock).toHaveBeenCalledWith([])
    expect(loggerMock.child).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      traceId: 'trace-1'
    })
    expect(request.requestingService).toBeNull()
  })

  describe('serviceAccount', () => {
    test('constructs a service-account RuralPaymentsBusiness instance, injecting the configured DAL email as the "service-account" header, when the standard instance is on the external route', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      loggerChild.mockReturnValue({ log: jest.fn() })
      const configGetSpy = jest
        .spyOn(config, 'get')
        .mockImplementation((path) =>
          path === 'kits.dalServiceAccountEmail' ? 'dal-service-account@example.com' : undefined
        )
      RuralPaymentsBusinessMock.mockImplementationOnce(() => ({
        isExternalRoute: () => true
      }))
      RuralPaymentsBusinessMock.mockImplementationOnce(() => ({
        marker: 'service-account-instance'
      }))
      const request = { headers: { 'x-forwarded-authorization': 'token123' } }

      const result = await context({ request })

      expect(RuralPaymentsBusinessMock).toHaveBeenCalledTimes(2)
      expect(RuralPaymentsBusinessMock).toHaveBeenNthCalledWith(
        2,
        { logger: expect.anything() },
        {
          request: {
            ...request,
            headers: { ...request.headers, 'service-account': 'dal-service-account@example.com' }
          }
        }
      )
      expect(result.dataSources.serviceAccount.ruralPaymentsBusiness).toEqual({
        marker: 'service-account-instance'
      })

      configGetSpy.mockRestore()
    })

    test('does not construct a service-account data source when the standard instance is not on the external route', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      loggerChild.mockReturnValue({ log: jest.fn() })
      RuralPaymentsBusinessMock.mockImplementationOnce(() => ({
        isExternalRoute: () => false
      }))
      const request = { headers: { email: 'user@example.com' } }

      const result = await context({ request })

      expect(RuralPaymentsBusinessMock).toHaveBeenCalledTimes(1)
      expect(result.dataSources.serviceAccount.ruralPaymentsBusiness).toBeNull()
    })
  })

  describe('stripClientSuppliedServiceAccountHeader', () => {
    test('removes a client-supplied "service-account" header from the request before continuing', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: {
          email: 'user@example.com',
          'service-account': 'someone@example.com'
        }
      }

      await expect(context({ request })).resolves.toBeDefined()

      expect(request.headers['service-account']).toBeUndefined()
    })

    test('does not affect requests that do not supply a "service-account" header', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = { headers: { email: 'user@example.com' } }

      await context({ request })

      expect(request.headers).toEqual({ email: 'user@example.com' })
    })

    test('the stripped header is not passed on to the RuralPaymentsBusiness instance', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: {
          'x-forwarded-authorization': 'token123',
          'service-account': 'someone@example.com'
        }
      }

      await context({ request })

      expect(RuralPaymentsBusinessMock).toHaveBeenNthCalledWith(1, expect.anything(), {
        request: { headers: { 'x-forwarded-authorization': 'token123' } }
      })
    })
  })

  describe('auditTrail', () => {
    test('exposes a fresh, independent audit trail on every call', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = { headers: { email: 'user@example.com' } }

      const first = await context({ request })
      const second = await context({ request })

      expect(first.auditTrail.recordEntity).toBeInstanceOf(Function)
      expect(first.auditTrail.recordAccount).toBeInstanceOf(Function)
      expect(first.auditTrail.getForRoot).toBeInstanceOf(Function)
      expect(first.auditTrail).not.toBe(second.auditTrail)

      first.auditTrail.recordAccount({ path: { key: 'business', prev: undefined } }, 'frn', '123')
      expect(first.auditTrail.getForRoot('business').accounts).toEqual({ frn: '123' })
      expect(second.auditTrail.getForRoot('business').accounts).toBeUndefined()
    })
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
        headers: { 'x-forwarded-authorization': 'placeholder-token' }
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.requesterId).toBeUndefined()
    })

    test('Audit correlationId is extracted from request traceId', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: { 'x-forwarded-authorization': 'placeholder-token' },
        traceId: '111-222-333'
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.correlationId).toBe('111-222-333')
    })

    test('Audit correlationId is undefined if no request traceId is found', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user' })
      const request = {
        headers: { 'x-forwarded-authorization': 'placeholder-token' }
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.correlationId).toBeUndefined()
    })

    test('Audit requestedSystem is extracted from requesting group response', async () => {
      getAuthMock.mockResolvedValue({ user: 'test-user', groups: ['group-1', 'group-2'] })
      getRequestingGroupMock.mockReturnValue('SOME_AD_GROUP')
      const request = {
        headers: { 'x-forwarded-authorization': 'placeholder-token' },
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
        headers: { 'x-forwarded-authorization': 'placeholder-token' },
        traceId: '111-222-333'
      }

      const result = await context({ request })
      expect(result.dataSources.hitachiPayments.audit.requestedSystem).toBeUndefined()
    })
  })
})
