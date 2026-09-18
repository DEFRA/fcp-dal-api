import diagnosticsChannel from 'node:diagnostics_channel'
import { performance } from 'node:perf_hooks'
import { config as appConfig } from '../config.js'
import { logger } from '../logger/logger.js'
import {
  RURALPAYMENTS_CONNECT_TIMING_001,
  RURALPAYMENTS_CONNECT_TIMING_002
} from '../logger/codes.js'

// connectParams is the SAME object instance undici passes to beforeConnect and to the matching
// connected/connectError event for one connection attempt - it's the only correlation key shared
// between the two payloads. A WeakMap means an attempt that never resolves can't leak memory:
// once nothing else references connectParams, the entry is collected automatically.
const connectStartTimes = new WeakMap()

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
  connectStartTimes.set(connectParams, performance.now())
}

export function onConnected({ connectParams }) {
  const startTime = connectStartTimes.get(connectParams)
  connectStartTimes.delete(connectParams)
  if (startTime === undefined) {
    // Either a different origin (filtered out at beforeConnect) or a genuinely unmatched event -
    // either way, nothing to report.
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
  const startTime = connectStartTimes.get(connectParams)
  connectStartTimes.delete(connectParams)

  // Unlike onConnected, a missing startTime here doesn't necessarily mean "skip" - a connect
  // error can fire without ever having seen beforeConnect. So the origin is checked explicitly,
  // rather than inferred from whether a start time was recorded.
  if (!isExternalGateway(connectParams)) {
    return
  }

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
    return
  }
  externalGatewayOrigin = originFor(new URL(appConfig.get('kits.external.gatewayUrl')))
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
  subscribed = false
}
