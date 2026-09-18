import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import diagnosticsChannel from 'node:diagnostics_channel'
import { config } from '../../../app/config.js'
import {
  RURALPAYMENTS_CONNECT_TIMING_001,
  RURALPAYMENTS_CONNECT_TIMING_002
} from '../../../app/logger/codes.js'
import { logger } from '../../../app/logger/logger.js'
import {
  registerConnectTiming,
  unregisterConnectTiming
} from '../../../app/instrumentation/undiciConnectTiming.js'

const beforeConnectChannel = diagnosticsChannel.channel('undici:client:beforeConnect')
const connectedChannel = diagnosticsChannel.channel('undici:client:connected')
const connectErrorChannel = diagnosticsChannel.channel('undici:client:connectError')

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

    expect(loggerInfoSpy).not.toHaveBeenCalled()
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
        code: RURALPAYMENTS_CONNECT_TIMING_002,
        requestTimeMs: expect.any(Number),
        error: { message: 'connect ECONNREFUSED', name: 'Error' }
      })
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

  test('correlates by connectParams object identity, not content', () => {
    mockConfig()
    registerConnectTiming()

    const params = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams: { ...params } })
    connectedChannel.publish({ connectParams: { ...params } })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('registerConnectTiming is idempotent', () => {
    mockConfig()
    registerConnectTiming()
    registerConnectTiming()

    const connectParams = { hostname: 'kits.example.com', port: '8443', protocol: 'https:' }
    beforeConnectChannel.publish({ connectParams })
    connectedChannel.publish({ connectParams })

    expect(loggerInfoSpy).toHaveBeenCalledTimes(1)
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
