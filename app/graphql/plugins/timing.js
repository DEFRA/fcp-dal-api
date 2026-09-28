import { performance } from 'node:perf_hooks'

const CODE = 'Graphql request timing'

const round = (ms) => Math.round(ms * 10) / 10

/**
 * Logs a per-phase timing breakdown for each GraphQL request, to show where request time is spent.
 * CDP only keeps a small set of log fields, so each phase is logged separately with its duration in
 * `requestTimeMs`, and any other detail in the message:
 * - context: Hapi receiving the request -> Apollo starting (payload parsing, context creation, auth)
 * - resolver Business.<field>: each resolver on the Business type (the ones that call upstream)
 * - execution: executing all resolvers; the message includes the number of fields resolved (the size
 *   of the result graph) and the process CPU time used (compare to the duration: CPU-bound vs waiting)
 * - apollo total: the whole Apollo request; the message includes the parse/validate time
 *
 * JSON serialisation of the result happens after this plugin logs; compare with the
 * `FCP - Access log` (same traceId) to see the remaining time.
 */
export function timingPlugin() {
  return {
    async requestDidStart({ contextValue }) {
      const start = performance.now()
      const requestLogger = contextValue?.requestLogger
      const log = (message, requestTimeMs) =>
        requestLogger?.info(`#DAL - GraphQL timing - ${message}`, { requestTimeMs, code: CODE })

      const received = contextValue?.request?.info?.received
      if (received) {
        log('context (payload parsing, auth)', Date.now() - received)
      }

      let parseValidateMs
      let fieldCount = 0

      return {
        async didResolveOperation() {
          parseValidateMs = round(performance.now() - start)
        },

        async executionDidStart() {
          const executionStart = performance.now()
          const cpuStart = process.cpuUsage()

          return {
            willResolveField({ info }) {
              fieldCount++
              if (info.parentType.name !== 'Business') {
                return undefined
              }
              const fieldStart = performance.now()
              return () => {
                log(`resolver Business.${info.fieldName}`, round(performance.now() - fieldStart))
              }
            },

            async executionDidEnd() {
              const { user, system } = process.cpuUsage(cpuStart)
              log(
                `execution: fields=${fieldCount} cpuMs=${round((user + system) / 1000)}`,
                round(performance.now() - executionStart)
              )
            }
          }
        },

        async willSendResponse({ operationName }) {
          log(
            `apollo total: operation=${operationName} parseValidateMs=${parseValidateMs}`,
            round(performance.now() - start)
          )
        }
      }
    }
  }
}
