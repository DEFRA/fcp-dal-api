import diagnosticsChannel from 'node:diagnostics_channel'
import { performance } from 'node:perf_hooks'
import { config as appConfig } from '../config.js'
import { logger } from '../logger/logger.js'
import {
  RURALPAYMENTS_CONNECT_TIMING_001,
  RURALPAYMENTS_CONNECT_TIMING_002
} from '../logger/codes.js'

// undici builds a FRESH connectParams object literal at each of its three publish call sites
// (client.js: beforeConnect, connected, connectError) - even for the same connection attempt,
// they are three distinct object instances, never the same reference. So correlation can't use
// object identity (a WeakMap keyed by connectParams never matches). Instead, since we only ever
// track one origin (the KITS external gateway), pair events chronologically: each beforeConnect
// for that origin pushes a start time, each connected/connectError for that origin shifts the
// oldest pending one. This assumes connects to this single origin are handled roughly in the
// order they start, which holds for the realistic case of a small, mostly-sequential pool.
const pendingConnectStartTimes = []

// undici:proxy:connected fires once the CONNECT tunnel to the proxy itself is established, before
// the TLS/mTLS handshake to the real target begins on top of that tunnel - splitting it out of
// the overall connect time isolates proxy-tunnel time from handshake time. Its connectParams
// describes the PROXY (an `origin` string, not `hostname`/`port`), so it can't be matched against
// externalGatewayOrigin the way client-level events can. Instead, only record one while a target
// beforeConnect is actually in flight - this can misattribute if other proxied traffic (Hitachi,
// JWKS, DefraID) interleaves during the same window, which is an accepted imprecision for this
// short, targeted investigative use.
const pendingProxyConnectedTimes = []

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
  pendingConnectStartTimes.push(performance.now())
}

export function onProxyConnected() {
  if (pendingConnectStartTimes.length === 0) {
    // No target connect in flight - not something we're tracking, ignore.
    return
  }
  pendingProxyConnectedTimes.push(performance.now())
}

// Splits an overall connect duration into proxy-tunnel time and handshake time, using a
// proxyConnected timestamp paired the same way as pendingConnectStartTimes (FIFO, since
// undici:proxy:connected can't be matched to a specific target by content). Returns undefined
// for both when no proxy was involved (or none was observed), leaving requestTimeMs as the only
// figure - which is exactly what happens when connectTimingEnabled runs with no proxy configured.
function splitConnectDuration(startTime, endTime) {
  const proxyConnectedTime = pendingProxyConnectedTimes.shift()
  if (proxyConnectedTime === undefined) {
    return { tunnelTimeMs: undefined, handshakeTimeMs: undefined }
  }
  return {
    tunnelTimeMs: proxyConnectedTime - startTime,
    handshakeTimeMs: endTime - proxyConnectedTime
  }
}

export function onConnected({ connectParams }) {
  if (!isExternalGateway(connectParams)) {
    return
  }

  const startTime = pendingConnectStartTimes.shift()
  if (startTime === undefined) {
    // No matching beforeConnect seen - e.g. registration happened mid-connect. Nothing to report.
    return
  }

  const now = performance.now()
  const requestTimeMs = now - startTime
  const { tunnelTimeMs, handshakeTimeMs } = splitConnectDuration(startTime, now)
  const split =
    tunnelTimeMs === undefined ? '' : `, tunnelMs=${tunnelTimeMs}, handshakeMs=${handshakeTimeMs}`

  logger.info(
    `#instrumentation - undici - KITS external gateway connection established (host=${originFor(connectParams)}${split})`,
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

  const startTime = pendingConnectStartTimes.shift()
  const now = performance.now()
  const requestTimeMs = startTime === undefined ? undefined : now - startTime
  const { tunnelTimeMs, handshakeTimeMs } =
    startTime === undefined
      ? { tunnelTimeMs: undefined, handshakeTimeMs: undefined }
      : splitConnectDuration(startTime, now)
  const split =
    tunnelTimeMs === undefined ? '' : `, tunnelMs=${tunnelTimeMs}, handshakeMs=${handshakeTimeMs}`

  logger.warn(
    `#instrumentation - undici - KITS external gateway connection failed (host=${originFor(connectParams)}${split})`,
    {
      type: 'http',
      code: RURALPAYMENTS_CONNECT_TIMING_002,
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
  logger.info(`externalGatewayOrigin=${externalGatewayOrigin}`)
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
  pendingConnectStartTimes.length = 0
  pendingProxyConnectedTimes.length = 0
  subscribed = false
}
