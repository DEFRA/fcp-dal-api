import { getRequestingGroup, getRequestingService } from '../../auth/authenticate.js'
import { config } from '../../config.js'
import { DAL_AUDIT_EVENT_001 } from '../../logger/codes.js'
import { getEndUserIpAddress } from '../../audit/audit-ip.js'
import { endUserAuthContext } from '../../auth/end-user-auth-context.js'
import { snsPublish } from '../../audit/sns-publisher.js'

const AUDIT_EVENT_SCHEMA_VERSION = '1.0.0'
const APPLICATION = 'Data Access Layer'
const COMPONENT = 'fcp-dal-api'
const ENVIRONMENT_NAME = config.get('cdp.env') ? `cdp-${config.get('cdp.env')}` : 'local'

// Using the http request headers, work out the identifier for the end user
function endUser(contextValue) {
  const authContext = endUserAuthContext(contextValue.request)
  if (authContext.internalAuthHeader) {
    return authContext.internalAuthHeader
  } else if (authContext.serviceAccount) {
    return authContext.serviceAccount
  } else {
    return `IDM/${contextValue.defraIdContext.crn()}`
  }
}

// Builds one AuditEventPayload for a single root selection.  Any entities/accounts explicitly
// identified in the resolver layer are added to the audit event.  If no entities are discovered
// then a top-level 'Audit' event is generated.  The request payload (GraphQL query and variables)
// is included in audit.details.requestBody so it's captured even without individual entity detail.
function buildEvent({ contextValue, rootSelection, errors }) {
  // For each error, extract the message, path and status code
  const mappedErrors = (errors ?? []).map((error) => ({
    message: error.message,
    path: error.path,
    code: error.extensions?.code ?? null
  }))

  const recorded = contextValue?.auditTrail?.getForRoot(rootSelection)

  let entities = recorded?.entities
  if (!entities) {
    // A root element has been processed, but no auditable entities have been found.  This may be
    // a genuine gap in auditing, make sure the request itself is audited
    entities = [{ entity: 'audit', action: 'created', entityid: contextValue.request.traceId }]
  }

  return {
    version: AUDIT_EVENT_SCHEMA_VERSION,
    user: endUser(contextValue),
    ip: getEndUserIpAddress(contextValue.request),
    // This is either the 'x-cdp-request-id' header or a new uuid generated at the start of this request
    correlationid: contextValue.request.traceId,
    // request.info.received is when Hapi received the request, not when this event is built/published.
    datetime: new Date(contextValue.request.info.received).toISOString(),
    environment: ENVIRONMENT_NAME,
    application: APPLICATION,
    component: COMPONENT,
    audit: {
      status: mappedErrors.length ? 'failure' : 'success',
      entities: entities,
      accounts: recorded?.accounts,
      details: {
        requestBody: JSON.stringify(contextValue.request?.payload),
        rootField: rootSelection,
        sourceSystem: getRequestingService(contextValue?.auth?.groups),
        sourceSystemSecurityGroupId: getRequestingGroup(contextValue?.auth?.groups),
        errorDetails: mappedErrors,
        serviceAccount: contextValue.auditTrail?.serviceAccount()
      }
    }
  }
}

/**
 * Emits one audit event per root selection touched by the query, from whatever contextValue.auditTrail
 * (see app/audit/audit-trail.js) recorded against it - resolvers record what they touched
 * (recordEntity/recordAccount) as they run, and this plugin reads it back once the response is
 * ready, rather than deriving it from the query document itself.
 *
 * If a root selection has nothing recorded against it, then an audit event is still created, so that nothing
 * is left un-audited .
 */
export function auditPlugin({ publish = snsPublish } = {}) {
  return {
    async requestDidStart() {
      return {
        async willSendResponse(requestContext) {
          const { contextValue, errors } = requestContext
          if (!contextValue?.auditTrail) {
            return
          }

          const requestLogger = contextValue.requestLogger

          const publishOne = async (event) => {
            try {
              await publish(event, requestLogger)
            } catch (error) {
              requestLogger.error('#DAL - audit event publish failed', {
                error,
                code: DAL_AUDIT_EVENT_001
              })
            }
          }

          try {
            const rootKeys = contextValue.auditTrail.rootKeys()

            if (rootKeys.length === 0) {
              // Nothing recorded a root selection at all (e.g. a parse/validation error, or a pure
              // introspection query) - the rootKeys loop below has nothing to iterate, so publish a
              // single audit/created event for the request itself instead.
              const event = buildEvent({ contextValue, errors })
              await publishOne(event)
            }

            await Promise.all(
              rootKeys.map((rootKey) => {
                const errorsForRoot = errors?.filter((error) => error.path?.[0] === rootKey)
                const event = buildEvent({
                  contextValue,
                  rootSelection: rootKey,
                  errors: errorsForRoot
                })
                return publishOne(event)
              })
            )
          } catch (error) {
            requestLogger.error('#DAL - audit event build failed', {
              error,
              code: DAL_AUDIT_EVENT_001
            })
          }
        }
      }
    }
  }
}
