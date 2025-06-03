import { describe, expect, jest } from '@jest/globals'
import { config } from '../../../app/config.js'

describe('RuralPayments Custom Fetch', () => {
  describe('customFetch', () => {
    it('should call fetch with an AbortSignal with timeout and proxy dispatcher', async () => {
      const fakeCert = 'KITS_CONNECTION_CERT'
      const fakeKey = 'KITS_CONNECTION_KEY'
      const fakeURL = 'https://rp_kits_gateway_internal_url/v1/'
      const timeout = 1500
      config.set('kits.gatewayTimeoutMs', `${timeout}`)
      config.set('kits.connectionCert', Buffer.from(fakeCert).toString('base64'))
      config.set('kits.connectionKey', Buffer.from(fakeKey).toString('base64'))
      config.set('kits.gatewayUrl', fakeURL)
      const kitsURL = new URL(fakeURL)

      const mockProxyAgent = jest.fn((...args) => args)
      const mockUndici = {
        ProxyAgent: mockProxyAgent
      }
      jest.unstable_mockModule('undici', () => mockUndici)

      const mockCreateSecureContext = jest.fn((...args) => args)
      const mockTLS = {
        default: {
          createSecureContext: mockCreateSecureContext
        }
      }
      jest.unstable_mockModule('node:tls', () => mockTLS)

      const mockFetch = jest.fn((...args) => args)
      global.fetch = mockFetch

      const mockAbortSignal = jest.fn((...args) => args)
      Object.defineProperty(AbortSignal, 'timeout', {
        configurable: true,
        writable: true,
        value: mockAbortSignal
      })

      const { customFetch } = await import(
        '../../../app/data-sources/rural-payments/RuralPayments.js'
      )

      const returnedCustomFetch = await customFetch('example-path', { method: 'GET' })

      expect(mockCreateSecureContext).toHaveBeenCalledWith({
        key: fakeKey,
        cert: fakeCert
      })

      const requestTls = {
        host: kitsURL.hostname,
        port: kitsURL.port,
        servername: kitsURL.hostname,
        secureContext: mockCreateSecureContext({
          key: fakeKey,
          cert: fakeCert
        })
      }

      expect(mockProxyAgent).toHaveBeenCalledWith({
        uri: config.get('cdp.httpsProxy'),
        requestTls
      })

      expect(mockAbortSignal).toHaveBeenCalledWith(timeout)

      expect(mockFetch).toHaveBeenCalledTimes(1)

      expect(returnedCustomFetch).toMatchObject([
        'example-path',
        {
          dispatcher: [
            {
              requestTls: requestTls,
              uri: 'https://cdp_https_proxy/'
            }
          ],
          method: 'GET',
          signal: [timeout]
        }
      ])
    })
  })
})
