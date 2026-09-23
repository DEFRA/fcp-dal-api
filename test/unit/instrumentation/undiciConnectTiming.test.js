import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import diagnosticsChannel from 'node:diagnostics_channel'
import { config } from '../../../app/config.js'
import { RURALPAYMENTS_CONNECT_TIMING_001 } from '../../../app/logger/codes.js'
import { logger } from '../../../app/logger/logger.js'
import {
  registerConnectTiming,
  unregisterConnectTiming
} from '../../../app/instrumentation/undiciConnectTiming.js'

const beforeConnectChannel = diagnosticsChannel.channel('undici:client:beforeConnect')
const connectedChannel = diagnosticsChannel.channel('undici:client:connected')
const connectErrorChannel = diagnosticsChannel.channel('undici:client:connectError')
const proxyConnectedChannel = diagnosticsChannel.channel('undici:proxy:connected')

const EXTERNAL_GATEWAY_URL = 'https://kits.example.com:8443/external'

describe('undiciConnectTiming', () => {
  let configGetSpy
  let loggerInfoSpy
  let loggerWarnSpy

  const mockConfig = ({ enabled = true, gatewayUrl = EXTERNAL_GATEWAY_URL } = {}) => {
    configGetSpy.mockImplementation((key) => {
      if (key === 'kits.external.connectTimingEnabled') return enabled
      if (key === 'kits.external.gatewayUrl') return gatewayUrl
      return undefined
    })
  }

  beforeEach(() => {
    configGetSpy = jest.spyOn(config, 'get')
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {})
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    unregisterConnectTiming()
  })

  test('does nothing when disabled', () => {
    mockConfig({ enabled: false })
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Not registering for diagnostics: subs false, enabled false'
    )
  })

  test('logs requestTimeMs on connection established to the external gateway', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('host=kits.example.com:8443'),
      expect.objectContaining({
        type: 'http',
        code: RURALPAYMENTS_CONNECT_TIMING_001,
        requestTimeMs: expect.any(Number)
      })
    )
  })

  test('logs requestTimeMs and error details on connectError to the external gateway', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    const error = new Error('connect ECONNREFUSED')
    beforeConnectChannel.publish({ connectParams })
    connectErrorChannel.publish({ connectParams, error })

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('host=kits.example.com:8443'),
      expect.objectContaining({
        type: 'http',
        code: RURALPAYMENTS_CONNECT_TIMING_001,
        requestTimeMs: expect.any(Number),
        error: { message: 'connect ECONNREFUSED', name: 'Error' }
      })
    )
  })

  test('splits tunnel vs handshake time when a proxyConnected event lands between beforeConnect and connected', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    proxyConnectedChannel.publish({ connectParams: { origin: 'http://proxy.example.com:3128' } })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringMatching(/tunnelMs=\d+(\.\d+)?, handshakeMs=\d+(\.\d+)?/),
      expect.objectContaining({ code: RURALPAYMENTS_CONNECT_TIMING_001 })
    )
  })

  test('omits the tunnel/handshake split when no proxyConnected event is observed (no proxy configured)', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.not.stringContaining('tunnelMs'),
      expect.objectContaining({ code: RURALPAYMENTS_CONNECT_TIMING_001 })
    )
  })

  test('ignores a proxyConnected event when no target connect is in flight', () => {
    mockConfig()
    registerConnectTiming()

    proxyConnectedChannel.publish({ connectParams: { origin: 'http://proxy.example.com:3128' } })

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.not.stringContaining('tunnelMs'),
      expect.objectContaining({ code: RURALPAYMENTS_CONNECT_TIMING_001 })
    )
  })

  test('splits tunnel vs handshake time on connectError too', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    proxyConnectedChannel.publish({ connectParams: { origin: 'http://proxy.example.com:3128' } })
    connectErrorChannel.publish({ connectParams, error: new Error('handshake failed') })

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/tunnelMs=\d+(\.\d+)?, handshakeMs=\d+(\.\d+)?/),
      expect.objectContaining({ code: RURALPAYMENTS_CONNECT_TIMING_001 })
    )
  })

  test('ignores connections to a different origin, on connected', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'hitachi.example.com', port: '443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('ignores connections to a different origin, on connectError', () => {
    mockConfig()
    registerConnectTiming()

    const connectParams = { hostname: 'hitachi.example.com', port: '443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectErrorChannel.publish({ connectParams, error: new Error('boom') })

    expect(loggerWarnSpy).not.toHaveBeenCalled()
  })

  test('distinguishes the external gateway from the internal gateway sharing a hostname but differing only by port', () => {
    mockConfig()
    registerConnectTiming()

    const external = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    const internal = { hostname: 'kits.example.com', port: '9443', protocol: 'https:' }

    beforeConnectChannel.publish({ connectParams: external })
    connectedChannel.publish({ connectParams: external })
    beforeConnectChannel.publish({ connectParams: internal })
    connectedChannel.publish({ connectParams: internal })

    expect(loggerInfoSpy).toHaveBeenCalledTimes(1)
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('host=kits.example.com:8443'),
      expect.anything()
    )
  })

  test('ignores connected event with no matching beforeConnect', () => {
    mockConfig()
    registerConnectTiming()

    connectedChannel.publish({
      connectParams: { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('correlates beforeConnect and connected by content, not object identity (matches real undici, which builds a fresh connectParams object literal per publish call)', () => {
    mockConfig()
    registerConnectTiming()

    const params = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams: { ...params } })
    connectedChannel.publish({ connectParams: { ...params } })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('host=kits.example.com:8443'),
      expect.objectContaining({ code: RURALPAYMENTS_CONNECT_TIMING_001 })
    )
  })

  test('correctly correlates two overlapping, out-of-order-completing connects (no cross-contamination)', async () => {
    mockConfig()
    registerConnectTiming()
    // registerConnectTiming logs its own "externalGatewayOrigin=..." debug line - clear it so the
    // count assertion below only reflects the two connect events themselves.
    loggerInfoSpy.mockClear()

    const attemptA = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    const attemptB = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }

    // beforeConnect/connected for each attempt are genuinely spread across real async ticks (via
    // setTimeout), not called back-to-back synchronously - this is what actually exercises
    // AsyncLocalStorage's context propagation, unlike the other tests above which publish
    // synchronously and would pass even with the old, broken FIFO design.
    const runAttempt = (connectParams, startDelayMs, connectDurationMs) =>
      new Promise((resolve) => {
        setTimeout(() => {
          beforeConnectChannel.publish({ connectParams })
          setTimeout(() => {
            connectedChannel.publish({ connectParams })
            resolve()
          }, connectDurationMs)
        }, startDelayMs)
      })

    // A starts first but takes much longer; B starts after A but finishes well before it -
    // completion order differs from start order, which is exactly what broke FIFO pairing.
    await Promise.all([runAttempt(attemptA, 0, 80), runAttempt(attemptB, 10, 5)])

    expect(loggerInfoSpy).toHaveBeenCalledTimes(2)
    const [firstLoggedDurationMs, secondLoggedDurationMs] = loggerInfoSpy.mock.calls.map(
      ([, meta]) => meta.requestTimeMs
    )
    // B finishes first and logs first - it must show its own short duration, not A's much
    // longer one (and neither should ever be negative, which is what FIFO produced in practice).
    expect(firstLoggedDurationMs).toBeGreaterThanOrEqual(0)
    expect(firstLoggedDurationMs).toBeLessThan(40)
    expect(secondLoggedDurationMs).toBeGreaterThan(40)
  })

  test('registerConnectTiming is idempotent', () => {
    mockConfig()
    registerConnectTiming()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledTimes(2)
  })

  test('unregisterConnectTiming detaches the subscribers', () => {
    mockConfig()
    registerConnectTiming()
    unregisterConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })
})
