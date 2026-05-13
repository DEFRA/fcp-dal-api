export const partialResponsePlugin = {
  async requestDidStart() {
    let succeeded = 0
    let failed = 0

    return {
      async executionDidStart() {
        return {
          willResolveField() {
            return (error) => {
              // Track the resolver status for every resolved field
              if (error) {
                failed++
              } else {
                succeeded++
              }
            }
          }
        }
      },

      async willSendResponse({ response }) {
        const result = response.body.singleResult
        if (result) {
          const partial = succeeded > 0 && failed > 0

          // In the partial response scenario, at least one upstream call has failed and at least one
          // has passed.  The failed call is likely to have resulted in an overall non-2XX status code,
          // (via error.extensions.code), but in this hybrid state, we actually want to send a 206
          // response - to indicate to the client that this is not a full-error.  We also set the partialResponse
          // custom extension property to true, so that clients don't need to depend on http status codes for this
          // information
          if (partial) {
            response.http.status = 206
          }
          result.extensions = { ...result.extensions, partialResponse: partial }
        }
      }
    }
  }
}
