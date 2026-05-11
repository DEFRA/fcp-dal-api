import { containsAnyResolvedData } from '../../utils/response.js'

export const deriveResponseCodePlugin = {
  async requestDidStart() {
    return {
      async willSendResponse({ response }) {
        const { data, errors } = response.body.singleResult ?? {}

        const hasErrors = errors?.length > 0

        // This is a partial response scenario.  At least one upstream call has failed, but there is
        // also data to be returned.  The errors are likely to have indicated non-2XX status code,
        // (via error.extensions.code), but in this hybrid state, we actually want to send a 206
        // response - to indicate to the client that this is not a full-error
        if (hasErrors && containsAnyResolvedData(data)) {
          response.http.status = 206
        }
      }
    }
  }
}
