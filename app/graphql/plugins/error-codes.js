// The access log (app/server.js) is written after the response has gone, when the graphql errors
// are no longer to hand, so the codes are left on the request for it to pick up.
//
// Only the codes are kept, never the messages: a message can repeat a value the caller sent (e.g.
// `Variable "$sbi" got invalid value "..."`), and sbi and crn must stay out of the logs.
export function errorCodesPlugin() {
  return {
    async requestDidStart() {
      return {
        async willSendResponse({ contextValue, response }) {
          const errors = response?.body?.singleResult?.errors
          if (!errors?.length || !contextValue?.request) {
            return
          }

          contextValue.request.graphqlErrorCodes = [
            ...new Set(errors.map((error) => error.extensions?.code ?? 'UNKNOWN'))
          ]
        }
      }
    }
  }
}
