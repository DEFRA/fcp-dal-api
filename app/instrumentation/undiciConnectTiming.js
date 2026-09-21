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

export function onConnected({ connectParams }) {
  if (!isExternalGateway(connectParams)) {
    return
  }

  const startTime = pendingConnectStartTimes.shift()
  if (startTime === undefined) {
    // No matching beforeConnect seen - e.g. registration happened mid-connect. Nothing to report.
    return
  }

  const requestTimeMs = performance.now() - startTime

  logger.info(
    `#instrumentation - undici - KITS external gateway connection established (host=${originFor(connectParams)})`,
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
  const requestTimeMs = startTime === undefined ? undefined : performance.now() - startTime

  logger.warn(
    `#instrumentation - undici - KITS external gateway connection failed (host=${originFor(connectParams)})`,
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
  pendingConnectStartTimes.length = 0
  subscribed = false
}
