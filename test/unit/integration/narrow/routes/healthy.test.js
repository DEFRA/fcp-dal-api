import { jest } from '@jest/globals'
import { config } from '../../../../../app/config.js'
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
    config.set('healthCheck.enabled', true)
    config.set('healthCheck.ruralPaymentsInternalOrganisationId', 'test-org-id')
    config.set('healthCheck.ruralPaymentsPortalEmail', 'test@example.com')
    config.set('healthCheck.gatewayTimeoutMs', 1)

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
    config.set('healthCheck.enabled', false)
    config.set('cdp.env', 'dev')

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
    config.set('healthCheck.enabled', false)
    config.set('cdp.env', 'prod')

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

  it('GET /healthy route returns 200 with services status when health check disabled', async () => {
    config.set('healthCheck.enabled', false)

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
