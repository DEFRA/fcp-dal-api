import { beforeEach, describe, expect, jest } from '@jest/globals'
import tls from 'tls'

const fetch11 = jest.fn()
// Ensure undici's fetch and EnvHttpProxyAgent are mocked so calls can be inspected in tests.
jest.mock('undici', () => {
  const actual = jest.requireActual('undici')
  function EnvHttpProxyAgentMock(opts) {
    EnvHttpProxyAgent.mockConstructorArgs = opts
    return { isMockAgent: true }
  }
  return {
    ...actual,
    EnvHttpProxyAgent: EnvHttpProxyAgentMock,
    fetch: (...args) => fetch11(...args)
  }
})

const { EnvHttpProxyAgent } = jest.requireMock('undici')

import { config } from '../../../../app/config.js'

const fakeCert = 'KITS_CONNECTION_CERT'
const fakeKey = 'KITS_CONNECTION_KEY'
const b64fakeCert = Buffer.from(fakeCert).toString('base64')
const b64fakeKey = Buffer.from(fakeKey).toString('base64')

const timeout = 1500

const fakeInternalURL = 'https://rp_kits_gateway_internal_url/v1/'
const fakeExternalURL = 'https://rp_kits_gateway_external_url/v1/'

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

    // ensure decoded MTLS objects are present on the config for constructor to pick up
    config.internalMTLS = { key: fakeKey, cert: fakeCert }
    config.externalMTLS = { key: fakeKey, cert: fakeCert }

    jest.spyOn(global, 'fetch').mockImplementation((...args) => args)
    // EnvHttpProxyAgent is mocked at module-level (see jest.mock above) so constructor args will be
    // available on EnvHttpProxyAgent.mockConstructorArgs.
    jest.spyOn(tls, 'createSecureContext').mockImplementation((...args) => args)
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue([timeout])
  })

  afterEach(() => {
    delete config.internalMTLS
    delete config.externalMTLS
    jest.restoreAllMocks()
  })

  it('should initialise; fetch has INternal mTLS, gateway, & timeout', async () => {
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
      host: 'rp_kits_gateway_internal_url',
      port: '',
      servername: 'rp_kits_gateway_internal_url',
      secureContext: [{ key: fakeKey, cert: fakeCert }]
    }

    // check that the fetch works as expected with mTLS and timeout and that the EnvHttpProxyAgent
    // constructor gets the decoded credentials when the fetch is invoked
    fetch11.mockImplementationOnce(() => 'data')
    expect(
      rp.httpCache.httpFetch(`${fakeInternalURL}example-path`, {
        method: 'GET',
        headers: { 'Gateway-Type': 'internal' }
      })
    ).toBe('data')
    expect(EnvHttpProxyAgent.mockConstructorArgs).toEqual({ requestTls })

    expect(fetch11.mock.calls.length).toBe(1)
    const callArgs = fetch11.mock.calls[0]
    expect(callArgs[0]).toBe(`${fakeInternalURL}example-path`)
    expect(callArgs[1]).toMatchObject({
      method: 'GET',
      headers: { 'Gateway-Type': 'internal' },
      signal: [timeout]
    })
    expect(callArgs[1].dispatcher).toBeDefined()
  })

  it('should initialise; fetch has EXternal mTLS, gateway, & timeout', async () => {
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
      host: 'rp_kits_gateway_internal_url',
      port: '',
      servername: 'rp_kits_gateway_internal_url',
      secureContext: [{ key: fakeKey, cert: fakeCert }]
    }
    expect(EnvHttpProxyAgent.mockConstructorArgs).toEqual({ requestTls })

    // check that the fetch works as expected with mTLS and timeout
    fetch11.mockImplementationOnce(() => 'data')
    expect(
      rp.httpCache.httpFetch(`${fakeExternalURL}example-path`, {
        method: 'GET',
        headers: { 'Gateway-Type': 'external' }
      })
    ).toBe('data')

    expect(fetch11.mock.calls.length).toBe(1)
    const callArgs = fetch11.mock.calls[0]
    expect(callArgs[0]).toBe(`${fakeExternalURL}example-path`)
    expect(callArgs[1]).toMatchObject({
      method: 'GET',
      headers: { 'Gateway-Type': 'external' },
      signal: [timeout]
    })
    expect(callArgs[1].dispatcher).toBeDefined()
  })

  it('should initialise; fetch has internal URL, a timeout, but no mTLS', async () => {
    configMockPath['kits.disableMTLS'] = true

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

    // check that the fetch works as expected with timeout, but without mTLS
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
      signal: [timeout]
    })
  })

  it('should initialise; fetch has external URL, a timeout, but no mTLS', async () => {
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
      signal: [timeout]
    })
  })
})
