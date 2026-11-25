// Where the GraphQL dashboard is enabled (non-prod), unauthorised callers may introspect the
// schema, so tools such as Apollo Sandbox work without a token. app/graphql/context.js does not
// reject an unauthorised request there, but leaves the error on the context as
// `deferredAuthError`. Once the query has been parsed and validated, this plugin rethrows that
// error unless the operation only selects introspection root fields, which never reach the DAL's
// resolvers.
import { DAL_REQUEST_AUTHENTICATION_001 } from '../../logger/codes.js'
import { fragmentsByName, rootFieldNodes } from '../operation-fields.js'

export const INTROSPECTION_ROOT_FIELDS = new Set(['__schema', '__type', '__typename'])

export function anonymousIntrospectionPlugin() {
  return {
    async requestDidStart() {
      return {
        // Apollo calls this once the query has been parsed and validated and the operation to run
        // is known, but before any resolver runs. Throwing here fails the whole request
        async didResolveOperation({ document, operation, contextValue }) {
          const deferredAuthError = contextValue?.deferredAuthError
          // No deferred error: the caller is authorised, or auth is disabled, so nothing to do here
          if (!deferredAuthError) {
            return
          }

          const introspectionOnly = rootFieldNodes(
            operation.selectionSet,
            fragmentsByName(document)
          ).every((field) => INTROSPECTION_ROOT_FIELDS.has(field.name.value))
          if (!introspectionOnly) {
            throw deferredAuthError
          }

          contextValue.requestLogger?.info(
            '#DAL Request authentication - unauthorised introspection query allowed',
            {
              type: 'http',
              code: DAL_REQUEST_AUTHENTICATION_001,
              reason: deferredAuthError.extensions?.code
            }
          )
        }
      }
    }
  }
}
