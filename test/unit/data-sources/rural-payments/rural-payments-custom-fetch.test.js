import { beforeEach, describe, expect, jest } from '@jest/globals'
import https from 'node:https'
import tls from 'node:tls'
import { config } from '../../../../app/config.js'

const fakeCert = 'KITS_CONNECTION_CERT'
const fakeKey = 'KITS_CONNECTION_KEY'
const b64fakeCert = Buffer.from(fakeCert).toString('base64')
const b64fakeKey = Buffer.from(fakeKey).toString('base64')

const timeout = 1500

const fakeInternalURL = 'https://rp_kits_gateway_internal_url/v1/'
const fakeExternalURL = 'https://rp_kits_gateway_external_url/v1/'
const kitsInternalURL = new URL(fakeInternalURL)
const kitsExternalURL = new URL(fakeExternalURL)

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
    jest.spyOn(https, 'Agent').mockImplementation((...args) => args)
    jest.spyOn(tls, 'createSecureContext').mockImplementation((...args) => args)
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue([timeout])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should initialise the data source with the fetch configured with mTLS and timeout', async () => {
    const { RuralPayments } = await import(
      `../../../../app/data-sources/rural-payments/RuralPayments.js?update=${Date.now()}`
    )
    const request = {}
    const rp = new RuralPayments(config, {
      request,
      gatewayType: 'internal',
      internalGatewayDevOverrideEmail: 'override-email'
    })

    expect(rp.request).toBe(request)
    expect(rp.gatewayType).toBe('internal')
    expect(rp.internalGatewayDevOverrideEmail).toBe('override-email')
    expect(rp.baseURL).toBe(fakeInternalURL)
    const requestTls = {
      host: kitsInternalURL.hostname,
      port: kitsInternalURL.port,
      servername: kitsInternalURL.hostname,
      secureContext: tls.createSecureContext({
        key: fakeKey,
        cert: fakeCert
      })
    }
    expect(https.Agent).toHaveBeenCalledWith(requestTls)

    // check that the fetch works as expected with mTLS and timeout
    fetch.mockImplementationOnce(() => 'data')
    expect(
      rp.httpCache.httpFetch(`${fakeInternalURL}example-path`, {
        method: 'GET',
        headers: { 'Gateway-Type': 'internal' }
      })
    ).toBe('data')
    expect(fetch).toHaveBeenCalledWith(`${fakeInternalURL}example-path`, {
      method: 'GET',
      headers: { 'Gateway-Type': 'internal' },
      agent: [requestTls],
      signal: [timeout]
    })
  })

  it('should initialise data source with fetch configured with timeout but no mTLS', async () => {
    configMockPath.disableProxy = true
    configMockPath['kits.disableMTLS'] = true

    const { RuralPayments } = await import(
      `../../../../app/data-sources/rural-payments/RuralPayments.js?update=${Date.now()}`
    )
    const request = {}
    const rp = new RuralPayments(config, {
      request,
      gatewayType: 'external',
      internalGatewayDevOverrideEmail: 'override-email'
    })

    expect(rp.request).toBe(request)
    expect(rp.gatewayType).toBe('external')
    expect(rp.internalGatewayDevOverrideEmail).toBe('override-email')
    expect(rp.baseURL).toBe(fakeExternalURL)
    const requestTls = {
      host: kitsExternalURL.hostname,
      port: kitsExternalURL.port,
      servername: kitsExternalURL.hostname
    }
    expect(https.Agent).toHaveBeenCalledWith(requestTls)

    // check that the fetch works as expected with timeout, but without mTLS
    fetch.mockImplementationOnce(() => 'data')
    expect(
      rp.httpCache.httpFetch(`${fakeExternalURL}example-path`, {
        method: 'GET',
        headers: { 'Gateway-Type': 'external' }
      })
    ).toBe('data')
    expect(fetch).toHaveBeenCalledWith(`${fakeExternalURL}example-path`, {
      method: 'GET',
      headers: { 'Gateway-Type': 'external' },
      agent: [requestTls],
      signal: [timeout]
    })
  })
})
