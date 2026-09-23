import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import diagnosticsChannel from 'node:diagnostics_channel'
import { config } from '../../../app/config.js'
import { RURALPAYMENTS_RESPONSE_TIMING_001 } from '../../../app/logger/codes.js'
import { logger } from '../../../app/logger/logger.js'
import {
  registerResponseTiming,
  unregisterResponseTiming
} from '../../../app/instrumentation/undiciResponseTiming.js'

const requestHeadersChannel = diagnosticsChannel.channel('undici:request:headers')
const requestTrailersChannel = diagnosticsChannel.channel('undici:request:trailers')
const requestErrorChannel = diagnosticsChannel.channel('undici:request:error')

const EXTERNAL_GATEWAY_URL = 'https://kits.example.com:8443/external'
const EXTERNAL_GATEWAY_ORIGIN = 'https://kits.example.com:8443'

describe('undiciResponseTiming', () => {
  let configGetSpy
  let loggerInfoSpy

  const mockConfig = ({ enabled = true, gatewayUrl = EXTERNAL_GATEWAY_URL } = {}) => {
    configGetSpy.mockImplementation((key) => {
      if (key === 'kits.external.connectTimingEnabled') return enabled
      if (key === 'kits.external.gatewayUrl') return gatewayUrl
      return undefined
    })
  }

  const makeRequest = (overrides = {}) => ({
    origin: EXTERNAL_GATEWAY_ORIGIN,
    path: '/external/some-path',
    ...overrides
  })

  beforeEach(() => {
    configGetSpy = jest.spyOn(config, 'get')
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    unregisterResponseTiming()
  })

  test('does nothing when disabled', () => {
    mockConfig({ enabled: false })
    registerResponseTiming()

    const request = makeRequest()
    requestHeadersChannel.publish({ request })
    requestTrailersChannel.publish({ request })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Not registering for response diagnostics: subs false, enabled false'
    )
  })

  test('logs requestTimeMs when the response body and trailers are fully received', () => {
    mockConfig()
    registerResponseTiming()

    const request = makeRequest()
    requestHeadersChannel.publish({ request })
    requestTrailersChannel.publish({ request })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('path=/external/some-path'),
      expect.objectContaining({
        type: 'http',
        code: RURALPAYMENTS_RESPONSE_TIMING_001,
        requestTimeMs: expect.any(Number)
      })
    )
  })

  test('ignores requests to a different origin', () => {
    mockConfig()
    registerResponseTiming()

    const request = makeRequest({ origin: 'https://hitachi.example.com:443' })
    requestHeadersChannel.publish({ request })
    requestTrailersChannel.publish({ request })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('ignores trailers event with no matching headers event', () => {
    mockConfig()
    registerResponseTiming()

    requestTrailersChannel.publish({ request: makeRequest() })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('correlates headers and trailers by request object identity, even for concurrent requests sharing an origin', () => {
    mockConfig()
    registerResponseTiming()
    loggerInfoSpy.mockClear()

    const requestA = makeRequest({ path: '/external/a' })
    const requestB = makeRequest({ path: '/external/b' })

    requestHeadersChannel.publish({ request: requestA })
    requestHeadersChannel.publish({ request: requestB })
    requestTrailersChannel.publish({ request: requestB })
    requestTrailersChannel.publish({ request: requestA })

    expect(loggerInfoSpy).toHaveBeenCalledTimes(2)
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('path=/external/a'),
      expect.anything()
    )
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('path=/external/b'),
      expect.anything()
    )
  })

  test('a request:error clears tracking so a stray later trailers event for the same request is not reported', () => {
    mockConfig()
    registerResponseTiming()

    const request = makeRequest()
    requestHeadersChannel.publish({ request })
    requestErrorChannel.publish({ request, error: new Error('boom') })
    requestTrailersChannel.publish({ request })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('ignores a request:error for a different origin', () => {
    mockConfig()
    registerResponseTiming()

    const request = makeRequest({ origin: 'https://hitachi.example.com:443' })
    requestHeadersChannel.publish({ request })
    requestErrorChannel.publish({ request, error: new Error('boom') })
    requestTrailersChannel.publish({ request })

    // Since the request never matched the external gateway, headers never started tracking it
    // either - so there is nothing for the (ignored) error event to have cleared.
    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })

  test('registerResponseTiming is idempotent', () => {
    mockConfig()
    registerResponseTiming()
    registerResponseTiming()

    const request = makeRequest()
    requestHeadersChannel.publish({ request })
    requestTrailersChannel.publish({ request })

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Not registering for response diagnostics: subs true, enabled true'
    )
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('path=/external/some-path'),
      expect.objectContaining({ code: RURALPAYMENTS_RESPONSE_TIMING_001 })
    )
  })

  test('unregisterResponseTiming detaches the subscribers', () => {
    mockConfig()
    registerResponseTiming()
    unregisterResponseTiming()

    const request = makeRequest()
    requestHeadersChannel.publish({ request })
    requestTrailersChannel.publish({ request })

    expect(loggerInfoSpy).not.toHaveBeenCalled()
  })
})
