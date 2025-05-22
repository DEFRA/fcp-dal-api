import { jest } from '@jest/globals'
import { RuralPaymentsBusiness } from '../../../../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'

const mockThrottle = (fn) => {
  return async (...args) => {
    return await fn(...args)
  }
}

const mockThrottleModule = {
  throttle: mockThrottle
}

jest.unstable_mockModule('../../../../../app/utils/throttle.js', () => mockThrottleModule)

const { server } = await import('../../../../../app/server.js')

describe('Healthy test', () => {
  const mockGetOrganisationById = jest.spyOn(RuralPaymentsBusiness.prototype, 'getOrganisationById')

  beforeEach(async () => {
    process.env.HEALTH_CHECK_ENABLED = 'true'
    process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID = 'test-org-id'
    process.env.RURAL_PAYMENTS_PORTAL_EMAIL = 'test@example.com'
    process.env.HEALTH_CHECK_RURAL_PAYMENTS_THROTTLE_TIME_MS = 1

    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  it('GET /healthy route returns 200 with services status when health check is enabled', async () => {
    mockGetOrganisationById.mockResolvedValue({
      id: 'test-org-id'
    })

    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)

    expect(response.statusCode).toEqual(200)
    expect(JSON.parse(response.payload)).toEqual({
      RuralPaymentsPortal: 'up'
    })
  })

  it('GET /healthy route returns 200 with services status when health check is disabled', async () => {
    process.env.HEALTH_CHECK_ENABLED = 'false'
    process.env.ENVIRONMENT = 'dev'

    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toEqual(200)
    expect(JSON.parse(response.payload)).toEqual({
      RuralPaymentsPortal: 'up'
    })
  })

  it('GET /healthy route returns 200 with services status when health check is disabled in production', async () => {
    process.env.HEALTH_CHECK_ENABLED = 'false'
    process.env.ENVIRONMENT = 'prd1'

    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toEqual(200)
    expect(JSON.parse(response.payload)).toEqual({
      RuralPaymentsPortal: 'up'
    })
  })

  it('GET /healthy route returns 200 with services status when RuralPaymentsPortal is down', async () => {
    mockGetOrganisationById.mockResolvedValue(null)

    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)

    expect(response.statusCode).toEqual(200)
    expect(JSON.parse(response.payload)).toEqual({
      RuralPaymentsPortal: 'down'
    })
  })

  it('GET /healthy route returns 500 when RuralPaymentsPortal check throws error', async () => {
    mockGetOrganisationById.mockRejectedValue(new Error('API Error'))

    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toEqual(500)
    expect(response.payload).toEqual('error')
  })

  it('GET /healthy route returns 200 with services status when environment variables are missing', async () => {
    delete process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID
    delete process.env.RURAL_PAYMENTS_PORTAL_EMAIL

    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toEqual(200)
    expect(JSON.parse(response.payload)).toEqual({
      RuralPaymentsPortal: 'up'
    })
  })
})
