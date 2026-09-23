import diagnosticsChannel from 'node:diagnostics_channel'
import { performance } from 'node:perf_hooks'
import { config as appConfig } from '../config.js'
import { logger } from '../logger/logger.js'
import { RURALPAYMENTS_RESPONSE_TIMING_001 } from '../logger/codes.js'

// Unlike the connect events (which only carry a content-alike connectParams, rebuilt fresh per
// publish), undici passes the SAME request object through create/headers/trailers/error for one
// attempt - so timing state can be stashed directly against it, with no need for the
// AsyncLocalStorage correlation undiciConnectTiming.js relies on.
const headersReceivedAt = new WeakMap()

// Set once, in registerResponseTiming, from the same config the KITS external gateway itself is
// built from (see RuralPayments.js) - not read per-event.
let externalGatewayOrigin

function isExternalGateway(request) {
  return request.origin === externalGatewayOrigin
}

// Marks when the response headers arrive - the point from which undici's own book-keeping (not
// JSON.parse, which happens later in our own parseBody) has a complete response to work with.
export function onRequestHeaders({ request }) {
  if (!isExternalGateway(request)) {
    return
  }
  headersReceivedAt.set(request, performance.now())
}

// Published once the response body and trailers have fully arrived - i.e. the network transfer is
// complete. This measures headers-to-fully-received-body time only; it does not cover the
// subsequent JSON.parse in our own parseBody override.
//
// Logged as requestTimeMs, not e.g. bodyReceiveTimeMs, so it's picked up by
// winstonFormatters.js's cdpSchemaTranslator the same way every other timing instrumentation in
// this codebase is - that formatter only recognises the literal field name requestTimeMs to
// populate http.response.response_time and event.duration.
export function onRequestTrailers({ request }) {
  if (!isExternalGateway(request) || !headersReceivedAt.has(request)) {
    return
  }
  const requestTimeMs = performance.now() - headersReceivedAt.get(request)
  headersReceivedAt.delete(request)

  logger.info(
    `#instrumentation - undici - KITS external gateway response body received (path=${request.path})`,
    {
      type: 'http',
      code: RURALPAYMENTS_RESPONSE_TIMING_001,
      requestTimeMs
    }
  )
}

// Clears tracking state for a request that's going to error, so a later, unrelated event can never
// be mismatched against this request's stale headersReceivedAt entry.
export function onRequestError({ request }) {
  if (!isExternalGateway(request)) {
    return
  }
  headersReceivedAt.delete(request)
}

let subscribed = false

export function registerResponseTiming() {
  if (subscribed || !appConfig.get('kits.external.connectTimingEnabled')) {
    logger.info(
      `Not registering for response diagnostics: subs ${subscribed}, enabled ${appConfig.get('kits.external.connectTimingEnabled')}`
    )
    return
  }
  externalGatewayOrigin = new URL(appConfig.get('kits.external.gatewayUrl')).origin
  diagnosticsChannel.subscribe('undici:request:headers', onRequestHeaders)
  diagnosticsChannel.subscribe('undici:request:trailers', onRequestTrailers)
  diagnosticsChannel.subscribe('undici:request:error', onRequestError)
  subscribed = true
}

// Exported for test isolation only - diagnostics_channel's channel registry is a process-wide
// singleton keyed by name, so tests need a real way to unhook between cases.
export function unregisterResponseTiming() {
  if (!subscribed) {
    return
  }
  diagnosticsChannel.unsubscribe('undici:request:headers', onRequestHeaders)
  diagnosticsChannel.unsubscribe('undici:request:trailers', onRequestTrailers)
  diagnosticsChannel.unsubscribe('undici:request:error', onRequestError)
  subscribed = false
}
