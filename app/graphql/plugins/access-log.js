// The access log (app/server.js) is written after the response has gone, when the graphql request
// context is no longer to hand, so what it needs is left on the hapi request for it to pick up:
//  - graphqlOperation: the operation's type (query, mutation or subscription) and name (left
//    out for an anonymous operation). Not set when there is no operation, e.g. the query failed
//    to parse or validate
//  - graphqlErrorCodes: the distinct error codes, when the response has errors.
//    Only the codes are kept, never the messages: a message can repeat a value the caller sent
//    (e.g. `Variable "$sbi" got invalid value "..."`), and sbi and crn must stay out of the logs.

export function accessLogPlugin() {
  return {
    async requestDidStart() {
      return {
        async willSendResponse({ contextValue, response, operation, operationName }) {
          const request = contextValue?.request
          if (!request) {
            return
          }

          if (operation) {
            request.graphqlOperation = {
              type: operation.operation,
              name: operationName ?? undefined
            }
          }

          const errors = response?.body?.singleResult?.errors
          if (errors?.length) {
            request.graphqlErrorCodes = [
              ...new Set(errors.map((error) => error.extensions?.code ?? 'UNKNOWN'))
            ]
          }
        }
      }
    }
  }
}
