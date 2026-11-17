import { getEndUserIpAddress } from '../../audit/audit-ip.js'
import { snsPublish } from '../../audit/sns-publisher.js'
import { config } from '../../config.js'
import { DAL_AUDIT_EVENT_001 } from '../../logger/codes.js'

const AUDIT_EVENT_SCHEMA_VERSION = '1.0.0'
const APPLICATION = 'Data Access Layer'
const COMPONENT = 'fcp-dal-api'
const ENVIRONMENT_NAME = config.get('cdp.env') ? `cdp-${config.get('cdp.env')}` : 'local'

// schema-discovery meta fields. __typename is left out on purpose: it only names a type and is
// commonly used as a cheap ping, so it keeps the generic audit event
const INTROSPECTION_FIELDS = new Set(['__schema', '__type'])
const INTROSPECTION_ROOT_FIELD = 'Introspection metadata'
const INTROSPECTION_ENTITY = { entity: 'graphql-introspection', action: 'read', entityid: '' }

// response keys (alias, else field name) of the operation's root fields, following fragments.
// undefined when there is no operation, e.g. the query failed to parse or validate
function rootFieldsOf({ operation, document }) {
  if (!operation) {
    return undefined
  }
  const fragments = new Map(
    (document?.definitions ?? [])
      .filter((definition) => definition.kind === 'FragmentDefinition')
      .map((definition) => [definition.name.value, definition])
  )
  const fields = []
  const visitedFragments = new Set()
  const collect = (selectionSet) => {
    for (const selection of selectionSet?.selections ?? []) {
      if (selection.kind === 'Field') {
        fields.push({
          name: selection.name.value,
          key: selection.alias?.value ?? selection.name.value
        })
      } else if (selection.kind === 'InlineFragment') {
        collect(selection.selectionSet)
      } else {
        // the only selection kind left is FragmentSpread
        const name = selection.name.value
        if (!visitedFragments.has(name)) {
          visitedFragments.add(name)
          collect(fragments.get(name)?.selectionSet)
        }
      }
    }
  }
  collect(operation.selectionSet)
  return fields
}

// Using the http request headers, work out the identifier for the end user
function endUser(contextValue) {
  const authContext = contextValue.authContext
  if (authContext.internalAuthHeader) {
    return authContext.internalAuthHeader
  } else if (authContext.serviceAccount) {
    return authContext.serviceAccount
  } else {
    try {
      return `IDM/${contextValue.defraIdContext.crn()}`
    } catch (error) {
      return `unknown`
    }
  }
}

// Builds one AuditEventPayload for a single root selection.  Any entities/accounts explicitly
// identified in the resolver layer are added to the audit event.  If no entities are discovered
// then a top-level 'Audit' event is generated.  The request payload (GraphQL query and variables)
// is included in audit.details.requestBody so it's captured even without individual entity detail.
function buildEvent({ contextValue, rootSelection, errors, fallbackEntities }) {
  // For each error, extract the message, path and status code
  const mappedErrors = (errors ?? []).map((error) => ({
    message: error.message,
    path: error.path,
    code: error.extensions?.code ?? null
  }))

  const recorded = contextValue?.auditTrail?.getForRoot(rootSelection)

  let entities = recorded?.entities ?? fallbackEntities
  if (!entities) {
    // A root element has been processed, but no auditable entities have been found.  This may be
    // a genuine gap in auditing, make sure the request itself is audited
    entities = [{ entity: 'audit', action: 'created', entityid: contextValue.request.traceId }]
  }

  return {
    version: AUDIT_EVENT_SCHEMA_VERSION,
    user: endUser(contextValue),
    ip: getEndUserIpAddress(contextValue.request),
    // This is either the 'x-cdp-request-id' header or a new uuid generated at the start of this
    // request
    correlationid: contextValue.request.traceId,
    // request.info.received is when Hapi received the request, not when this event is
    // built/published.
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
        sourceSystem: contextValue?.auth?.serviceName,
        sourceSystemEntityId: contextValue?.auth?.entityId,
        errorDetails: mappedErrors,
        serviceAccount: contextValue.auditTrail?.serviceAccount()
      }
    }
  }
}

/**
 * Emits one audit event per root selection touched by the query, from whatever
 * contextValue.auditTrail (see app/audit/audit-trail.js) recorded against it - resolvers record
 * what they touched (recordEntity/recordAccount) as they run, and this plugin reads it back once
 * the response is ready, rather than deriving it from the query document itself.
 *
 * If a root selection has nothing recorded against it, then an audit event is still created, so
 * that nothing is left un-audited .
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
            const rootFields = rootFieldsOf(requestContext)
            const introspectionKeys = (rootFields ?? [])
              .filter((field) => INTROSPECTION_FIELDS.has(field.name))
              .map((field) => field.key)
            const onlyIntrospection =
              introspectionKeys.length > 0 && introspectionKeys.length === rootFields.length
            const publishFallback = rootKeys.length === 0 && !onlyIntrospection
            const isIntrospectionError = (error) => introspectionKeys.includes(error.path?.[0])

            if (publishFallback) {
              // Nothing recorded a root selection at all (e.g. a parse/validation error) - the
              // rootKeys loop below has nothing to iterate, so publish a single audit/created event
              // for the request itself instead.
              const event = buildEvent({
                contextValue,
                errors: errors?.filter((error) => !isIntrospectionError(error))
              })
              await publishOne(event)
            }

            if (introspectionKeys.length > 0) {
              // introspection resolvers record nothing, so they get their own event alongside any
              // recorded roots in the same request. errors with no path (e.g. a missing variable)
              // belong to the whole request, so they land here when there is no fallback event
              const event = buildEvent({
                contextValue,
                rootSelection: INTROSPECTION_ROOT_FIELD,
                errors: errors?.filter(
                  (error) => isIntrospectionError(error) || (!publishFallback && !error.path)
                ),
                fallbackEntities: [INTROSPECTION_ENTITY]
              })
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
