import { jest } from '@jest/globals'
import { RuralPaymentsBusiness } from '../../../../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { server } from '../../../../../app/server.js'
// import throttle from '../../../../../app/utils/throttle.js'

describe('Healthy test', () => {
  beforeEach(async () => {
    process.env.HEALTH_CHECK_ENABLED = 'true'
    process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID = 'test-org-id'
    process.env.RURAL_PAYMENTS_PORTAL_EMAIL = 'test@example.com'
    process.env.HEALTH_CHECK_RURAL_PAYMENTS_THROTTLE_TIME_MS = 1
    // jest.spyOn(throttle, 'throttle').mockImplementation(() => {
    //   return (fn) => {
    //     return fn()
    //   }
    // })
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  it('GET /healthy route returns 200 with services status when health check is enabled', async () => {
    jest.spyOn(RuralPaymentsBusiness.prototype, 'getOrganisationById').mockResolvedValue({
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
    jest.spyOn(RuralPaymentsBusiness.prototype, 'getOrganisationById').mockResolvedValue(null)

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
    jest
      .spyOn(RuralPaymentsBusiness.prototype, 'getOrganisationById')
      .mockRejectedValue(new Error('API Error'))

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
