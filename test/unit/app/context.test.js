import { describe, jest } from '@jest/globals'

const getAuthMock = jest.fn()
const PermissionsMock = jest.fn()
const RuralPaymentsBusinessMock = jest.fn()
const RuralPaymentsCustomerMock = jest.fn()
const loggerChild = jest.fn()
const loggerMock = { child: loggerChild }

jest.unstable_mockModule('../../../app/auth/authenticate.js', () => ({
  getAuth: getAuthMock
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
    RuralPaymentsBusinessMock.mockImplementation(() => ({ type: 'Business' }))
    RuralPaymentsCustomerMock.mockImplementation(() => ({ type: 'Customer' }))
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

    expect(getAuthMock).toHaveBeenCalledWith(request)
    expect(loggerMock.child).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      traceId: 'trace-1'
    })
    expect(result.auth).toEqual({ user: 'test-user' })
    expect(result.requestLogger).toBeDefined()
    expect(result.dataSources.permissions.type).toBe('Permissions')
    expect(result.dataSources.ruralPaymentsBusiness.type).toBe('Business')
    expect(result.dataSources.ruralPaymentsCustomer.type).toBe('Customer')
    expect(result.kits.gatewayType).toBe('external')
    expect(result.kits.token).toBe('token123')
    expect(typeof result.kits.extractOrgIdFromDefraIdToken).toBe('function')
  })

  test('should default gatewayType to internal if not provided', async () => {
    const request = {
      headers: {
        'x-forwarded-authorization': 'token456'
      },
      transactionId: 'tx-2',
      traceId: 'trace-2'
    }

    const result = await context({ request })

    expect(result.kits.gatewayType).toBe('internal')
    expect(result.kits.token).toBe('token456')
  })
})
