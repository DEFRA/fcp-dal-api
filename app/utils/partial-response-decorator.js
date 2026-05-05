import { GraphQLError } from 'graphql'
import { config } from '../config.js'
import { logger } from '../logger/logger.js'

/**
 * If the DAL returns a 200 response code, but some of the requested data is missing, then
 * clients may want to handle this 'partial response'.  Typically, if data is missing, then
 * GraphQL will respond with an entry in the errors array, for each missing element.
 *
 * This plugin provides a mechanism to simulate a partial response, by adding an error to the
 * errors array, for the configured SBI, so that there is always at least one error returned.
 *
 * This plugin should never be enabled in a production environment (and is intended to be used
 * only in environments that are also configured with the upstream mock)
 *
 * TODO - If we proceed, then probably want to add CRN support as well.
 *
 */
const NonProdPartialResponseDecorator = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext) {
        if (
          requestContext.request.variables?.sbi !==
          config.get('nonProdPartialResponseDecorator.triggeringSbi')
        )
          return

        const result = requestContext.response.body.singleResult
        if (!result) return

        result.errors = [
          ...(result.errors ?? []),
          new GraphQLError('Simulated error to enable partial response testing')
        ]
      }
    }
  }
}

export const enableNonProdPartialResponseDecorator = () => {
  if (config.get('nonProdPartialResponseDecorator.enabled')) {
    logger.info('*'.repeat(500))
    return NonProdPartialResponseDecorator
  }

  return {} // Noop
}
