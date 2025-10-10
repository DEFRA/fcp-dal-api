import { beforeEach, describe, expect, jest } from '@jest/globals'
import tls from 'node:tls'
import undici from 'undici'
import { config } from '../../../../app/config.js'

const fakeCert = 'KITS_CONNECTION_CERT'
const fakeKey = 'KITS_CONNECTION_KEY'
const b64fakeCert = Buffer.from(fakeCert).toString('base64')
const b64fakeKey = Buffer.from(fakeKey).toString('base64')

const timeout = 1500

const fakeInternalURL = 'https://rp_kits_gateway_internal_url/v1/'
const fakeExternalURL = 'https://rp_kits_gateway_external_url/v1/'
const kitsInternalURL = new URL(fakeInternalURL)

describe('RuralPayments Custom Fetch', () => {
  let configMockPath
  beforeEach(() => {
    configMockPath = {
      'kits.gatewayTimeoutMs': timeout,
      'kits.internal.connectionCert': b64fakeCert,
      'kits.internal.connectionKey': b64fakeKey,
      'kits.internal.gatewayUrl': fakeInternalURL,
      'kits.disableMTLS': false,
      'kits.external.connectionCert': b64fakeCert,
      'kits.external.connectionKey': b64fakeKey,
      'kits.external.gatewayUrl': fakeExternalURL
    }
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )

    jest.spyOn(global, 'fetch').mockImplementation((...args) => args)
    jest.spyOn(undici, 'ProxyAgent').mockImplementation((...args) => args)
    jest.spyOn(undici, 'Agent').mockImplementation((...args) => args)
    jest.spyOn(tls, 'createSecureContext').mockImplementation((...args) => args)
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue([timeout])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call fetch with an AbortSignal with timeout and proxy dispatcher', async () => {
    const { customFetch } = await import(
      `../../../../app/data-sources/rural-payments/RuralPayments.js?update=${Date.now()}`
    )

    const requestTls = {
      host: kitsInternalURL.hostname,
      port: kitsInternalURL.port,
      servername: kitsInternalURL.hostname,
      secureContext: {
        key: fakeKey,
        cert: fakeCert
      }
    }

    const returnedCustomFetch = await customFetch(
      `${fakeInternalURL}example-path`,
      { method: 'GET', headers: { 'Gateway-Type': 'internal' } },
      requestTls
    )

    expect(returnedCustomFetch).toMatchObject([
      `${fakeInternalURL}example-path`,
      {
        dispatcher: [
          {
            requestTls,
            uri: config.get('cdp.httpsProxy')
          }
        ],
        method: 'GET',
        signal: [timeout]
      }
    ])

    expect(tls.createSecureContext).toHaveBeenCalledWith({
      key: fakeKey,
      cert: fakeCert
    })
    expect(undici.ProxyAgent).toHaveBeenCalledWith({
      requestTls,
      uri: config.get('cdp.httpsProxy')
    })
    expect(AbortSignal.timeout).toHaveBeenCalledWith(timeout)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should call fetch with an AbortSignal with timeout and proxy disabled without mTLS', async () => {
    configMockPath.disableProxy = true
    configMockPath['kits.disableMTLS'] = true

    const { customFetch } = await import(
      `../../../../app/data-sources/rural-payments/RuralPayments.js?update=${Date.now()}`
    )

    const requestTls = {
      host: kitsInternalURL.hostname,
      port: kitsInternalURL.port,
      servername: kitsInternalURL.hostname
    }

    const returnedCustomFetch = await customFetch(
      `${fakeInternalURL}example-path`,
      { method: 'GET', headers: { 'Gateway-Type': 'internal' } },
      requestTls
    )

    expect(returnedCustomFetch).toMatchObject([
      `${fakeInternalURL}example-path`,
      {
        dispatcher: [
          {
            requestTls
          }
        ],
        method: 'GET',
        signal: [timeout]
      }
    ])

    expect(tls.createSecureContext).not.toHaveBeenCalled()
    expect(undici.Agent).toHaveBeenCalledWith({ requestTls })
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(AbortSignal.timeout).toHaveBeenCalledWith(timeout)
  })
})
