import { beforeEach, describe, expect, jest } from '@jest/globals'
import tls from 'tls'

jest.mock('undici', () => {
  const actual = jest.requireActual('undici')
  function EnvHttpProxyAgentMock(opts) {
    this.opts = opts
  }
  return {
    ...actual,
    EnvHttpProxyAgent: EnvHttpProxyAgentMock
  }
})

import { config } from '../../../../app/config.js'

const fakeCert = 'KITS_CONNECTION_CERT'
const fakeKey = 'KITS_CONNECTION_KEY'
const b64fakeCert = Buffer.from(fakeCert).toString('base64')
const b64fakeKey = Buffer.from(fakeKey).toString('base64')

const fakeInternalURL = 'https://rp_kits_gateway_internal_url/v1/'
const fakeExternalURL = 'https://rp_kits_gateway_external_url/v1/'

describe('gateway-dispatcher', () => {
  beforeEach(() => {
    const configMockPath = {
      'kits.internal.connectionCert': b64fakeCert,
      'kits.internal.connectionKey': b64fakeKey,
      'kits.internal.gatewayUrl': fakeInternalURL,
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

    config.internalMTLS = { key: fakeKey, cert: fakeCert }
    config.externalMTLS = { key: fakeKey, cert: fakeCert }

    jest.spyOn(tls, 'createSecureContext').mockImplementation((...args) => args)
  })

  afterEach(() => {
    delete config.internalMTLS
    delete config.externalMTLS
    jest.restoreAllMocks()
  })

  // Each test dynamically reimports the module (rather than calling resetGatewayDispatchers) to
  // get a fully fresh dispatcher cache, isolated from every other test in this file.
  async function freshModule() {
    return import(
      `../../../../app/data-sources/rural-payments/gateway-dispatcher.js?update=${Date.now()}-${Math.random()}`
    )
  }

  it('builds requestTls from the internal gateway config for the internal route', async () => {
    const { getGatewayDispatcher } = await freshModule()

    const dispatcher = getGatewayDispatcher('internal')

    expect(dispatcher.opts).toEqual({
      requestTls: {
        host: 'rp_kits_gateway_internal_url',
        port: '',
        servername: 'rp_kits_gateway_internal_url',
        secureContext: [{ key: fakeKey, cert: fakeCert }]
      }
    })
  })

  it('builds requestTls from the external gateway config for the external route', async () => {
    const { getGatewayDispatcher } = await freshModule()

    const dispatcher = getGatewayDispatcher('external')

    expect(dispatcher.opts).toEqual({
      requestTls: {
        host: 'rp_kits_gateway_external_url',
        port: '',
        servername: 'rp_kits_gateway_external_url',
        secureContext: [{ key: fakeKey, cert: fakeCert }]
      }
    })
  })

  it('uses the cached dispatcher for subsequent calls', async () => {
    const { getGatewayDispatcher } = await freshModule()

    const first = getGatewayDispatcher('internal')
    const second = getGatewayDispatcher('internal')

    expect(second).toBe(first)
    expect(tls.createSecureContext).toHaveBeenCalledTimes(1)
  })

  it('builds a separate dispatcher per route', async () => {
    const { getGatewayDispatcher } = await freshModule()

    const internalDispatcher = getGatewayDispatcher('internal')
    const externalDispatcher = getGatewayDispatcher('external')

    expect(internalDispatcher).not.toBe(externalDispatcher)
  })

  it('resetGatewayDispatchers forces the next call to rebuild the dispatcher', async () => {
    const { getGatewayDispatcher, resetGatewayDispatchers } = await freshModule()

    const first = getGatewayDispatcher('internal')
    resetGatewayDispatchers()
    const second = getGatewayDispatcher('internal')

    expect(second).not.toBe(first)
    expect(tls.createSecureContext).toHaveBeenCalledTimes(2)
  })
})
