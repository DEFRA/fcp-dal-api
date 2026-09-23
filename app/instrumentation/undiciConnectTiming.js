import { AsyncLocalStorage } from 'node:async_hooks'
import diagnosticsChannel from 'node:diagnostics_channel'
import { performance } from 'node:perf_hooks'
import { config as appConfig } from '../config.js'
import { logger } from '../logger/logger.js'
import { RURALPAYMENTS_CONNECT_TIMING_001 } from '../logger/codes.js'

// beforeConnect's publish and the connect call it precedes happen synchronously, back to back, so
// AsyncLocalStorage.enterWith() here attaches to the async operation that's about to start. Node
// threads that same store through to wherever it completes - connected, connectError, or
// proxy:connected - correctly correlating each attempt even when several run concurrently and
// complete out of order.
const connectContext = new AsyncLocalStorage()

function originFor({ hostname, port }) {
  return `${hostname}:${port}`
}

// Set once, in registerConnectTiming, from the same config the KITS external gateway itself is
// built from (see RuralPayments.js) - not read per-event. Parsed to a hostname:port origin since
// connectParams never carries the raw gateway URL to compare against directly.
let externalGatewayOrigin

function isExternalGateway(connectParams) {
  return originFor(connectParams) === externalGatewayOrigin
}

export function onBeforeConnect({ connectParams }) {
  if (!isExternalGateway(connectParams)) {
    return
  }
  connectContext.enterWith({ startTime: performance.now() })
}

export function onProxyConnected() {
  const store = connectContext.getStore()
  if (!store || store.proxyConnectedTime !== undefined) {
    // Not part of a connect attempt we're tracking, or already recorded one for this attempt.
    return
  }
  store.proxyConnectedTime = performance.now()
}

// Formats the proxy-tunnel/handshake split for the log message, when a proxyConnected event was
// observed for this specific attempt (via the same async-context correlation as everything else
// here). Empty string when no proxy was involved, leaving requestTimeMs as the only figure.
function formatSplit(store, endTime) {
  if (store.proxyConnectedTime === undefined) {
    return ''
  }
  const tunnelTimeMs = store.proxyConnectedTime - store.startTime
  const handshakeTimeMs = endTime - store.proxyConnectedTime
  return `, tunnelMs=${tunnelTimeMs}, handshakeMs=${handshakeTimeMs}`
}

export function onConnected({ connectParams }) {
  if (!isExternalGateway(connectParams)) {
    return
  }

  const store = connectContext.getStore()
  if (!store) {
    // No matching beforeConnect context - e.g. registration happened mid-connect. Nothing to
    // report.
    return
  }

  const now = performance.now()
  const requestTimeMs = now - store.startTime

  logger.info(
    `#instrumentation - undici - KITS external gateway connection established (host=${originFor(connectParams)}${formatSplit(store, now)})`,
    {
      type: 'http',
      code: RURALPAYMENTS_CONNECT_TIMING_001,
      requestTimeMs
    }
  )
}

export function onConnectError({ connectParams, error }) {
  if (!isExternalGateway(connectParams)) {
    return
  }

  const store = connectContext.getStore()
  const now = performance.now()
  const requestTimeMs = store ? now - store.startTime : undefined

  logger.warn(
    `#instrumentation - undici - KITS external gateway connection failed (host=${originFor(connectParams)}${store ? formatSplit(store, now) : ''})`,
    {
      type: 'http',
      code: RURALPAYMENTS_CONNECT_TIMING_001,
      requestTimeMs,
      error: { message: error?.message, name: error?.name }
    }
  )
}

let subscribed = false

export function registerConnectTiming() {
  if (subscribed || !appConfig.get('kits.external.connectTimingEnabled')) {
    logger.info(
      `Not registering for diagnostics: subs ${subscribed}, enabled ${appConfig.get('kits.external.connectTimingEnabled')}`
    )
    return
  }
  externalGatewayOrigin = originFor(new URL(appConfig.get('kits.external.gatewayUrl')))
  diagnosticsChannel.subscribe('undici:client:beforeConnect', onBeforeConnect)
  diagnosticsChannel.subscribe('undici:client:connected', onConnected)
  diagnosticsChannel.subscribe('undici:client:connectError', onConnectError)
  diagnosticsChannel.subscribe('undici:proxy:connected', onProxyConnected)
  subscribed = true
}

// Exported for test isolation only - diagnostics_channel's channel registry is a process-wide
// singleton keyed by name, so tests need a real way to unhook between cases.
export function unregisterConnectTiming() {
  if (!subscribed) {
    return
  }
  diagnosticsChannel.unsubscribe('undici:client:beforeConnect', onBeforeConnect)
  diagnosticsChannel.unsubscribe('undici:client:connected', onConnected)
  diagnosticsChannel.unsubscribe('undici:client:connectError', onConnectError)
  diagnosticsChannel.unsubscribe('undici:proxy:connected', onProxyConnected)

  // enterWith() doesn't auto-clear - reset explicitly so no leftover store from a connect
  // attempt (or, in tests, a previous test case) can leak into whatever runs next.
  connectContext.enterWith(undefined)
  subscribed = false
}
