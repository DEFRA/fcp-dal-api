import { createAuditTrail } from '../audit/audit-trail.js'
import { getAuthorisedEntity, requireAuthorisedEntity } from '../auth/authenticate.js'
import { defraIdContext } from '../auth/defra-id.js'
import { endUserAuthContext } from '../auth/end-user-auth-context.js'
import { config } from '../config.js'
import { HitachiPayments } from '../data-sources/hitachi/HitachiPayments.js'
import { JWKS } from '../data-sources/JWKS.js'
import { MongoBusiness } from '../data-sources/mongo/Business.js'
import { MongoCustomer } from '../data-sources/mongo/Customer.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { RuralPaymentsReferenceData } from '../data-sources/rural-payments/RuralPaymentsReferenceData.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { logger } from '../logger/logger.js'
import { db } from '../mongo.js'
import { publishContextFailureAudit } from './plugins/audit.js'
import { logGraphQLError } from './plugins/error-logging.js'

export async function context({ request }) {
  // Filled in by buildContext as it goes, so a failure can be audited with whatever was known
  const progress = {}
  try {
    return await buildContext(request, { progress })
  } catch (error) {
    // Apollo's contextCreationDidFail hook is not given the request, so log and audit here where
    // the trace id (and the calling service, if authentication got that far) is known
    const tenant = request.requestingService && { tenant: { id: request.requestingService } }
    const requestLogger = logger.child({ traceId: request.traceId, ...tenant })
    logGraphQLError(requestLogger, error)
    // Apollo won't run the audit plugin for this request, so audit the failure here
    await publishContextFailureAudit({
      request,
      auth: progress.auth,
      authContext: progress.authContext,
      error,
      requestLogger
    })
    throw error
  }
}

/**
 * Applies the authorised-consumer gate (`requireAuthorisedEntity`).
 *
 * @param {{authenticated: boolean, authName?: string}} auth the result of `getAuthorisedEntity`
 * @returns {Error|undefined} the 401/403 error to defer to the anonymous-introspection plugin, if
 *  the caller is unauthorised and the dashboard is enabled
 * @throws {Unauthorized|Forbidden} if the caller is unauthorised and the dashboard is disabled
 */
function applyAuthGate(auth) {
  try {
    // Where the dashboard is disabled, block unauthorised callers before any Defra ID, upstream
    // or Mongo work is done. Where it is enabled, the error is deferred (below), so the rest of
    // the context, including Defra ID verification, is still built
    requireAuthorisedEntity(auth)
  } catch (error) {
    if (!config.get('graphqlDashboardEnabled')) {
      throw error
    }
    // Where the dashboard is enabled (non-prod), unauthorised callers may still introspect the
    // schema. The query hasn't been parsed yet, so the decision is left to the
    // anonymous-introspection plugin, which rethrows this error for anything else
    return error
  }
  return undefined
}

/**
 * Builds the per-request GraphQL context.
 *
 * @param {*} request the incoming HTTP request
 * @param {object} [options]
 * @param {boolean} [options.enforceAuth=true] `false` skips the authorised-consumer gate; only for
 *  test harnesses that substitute their own `auth` (see test/graphql/makeTestQuery.js)
 * @param {object} [options.progress] given `auth` and `authContext` as soon as each is known, so
 *  the caller can audit a request whose context fails part way through
 */
export async function buildContext(request, { enforceAuth = true, progress = {} } = {}) {
  const auth = await getAuthorisedEntity(request, new JWKS()) // TODO: make JWKS a singleton
  progress.auth = auth
  const requestingService = auth.serviceName
  request.requestingService = requestingService

  const deferredAuthError = enforceAuth ? applyAuthGate(auth) : undefined

  const requestLogger = logger.child({
    traceId: request.traceId,
    tenant: { id: requestingService }
  })

  const authContext = endUserAuthContext(request)
  progress.authContext = authContext
  const defraIdCtx = await defraIdContext(authContext, { traceId: request.traceId })
  const auditTrail = createAuditTrail(authContext)

  const datasourceOptions = [
    { logger: requestLogger },
    {
      request,
      defraIdContext: defraIdCtx
    }
  ]

  const internalServiceAccountDatasourceOptions = [
    { logger: requestLogger },
    {
      request: {
        ...request,
        headers: {
          ...request.headers,
          'service-account': authContext.serviceAccount || config.get('kits.dalServiceAccountEmail')
        }
      },
      defraIdContext: defraIdCtx
    }
  ]

  const standardAuthRuralPaymentsBusiness = new RuralPaymentsBusiness(...datasourceOptions)

  return {
    auth,
    deferredAuthError,
    authContext,
    request,
    requestLogger,
    auditTrail,
    defraIdContext: defraIdCtx,
    db,
    dataSources: {
      permissions: new Permissions({ logger: requestLogger }),
      ruralPaymentsBusiness: standardAuthRuralPaymentsBusiness,
      ruralPaymentsCustomer: new RuralPaymentsCustomer(...datasourceOptions),
      ruralPaymentsReferenceData: new RuralPaymentsReferenceData(...datasourceOptions),
      hitachiPayments: new HitachiPayments({
        logger: requestLogger,
        audit: {
          requestedSystem: auth.entityId,
          requesterId: request.headers.email,
          correlationId: request.traceId
        }
      }),
      mongoCustomer: new MongoCustomer({
        modelOrCollection: db.collection('customers')
      }),
      mongoBusiness: new MongoBusiness({
        modelOrCollection: db.collection('businesses'),
        logger: requestLogger
      }),
      serviceAccount: {
        // Service account only currently supported for ruralPaymentsBusiness.
        // Other ruralPayments datasources should be added here too if the need arises,
        // alongside a getXXXDataSource-style helper (see getRuralPaymentsBusinessDataSource in
        // resolvers/business/common.js) for resolvers to pick the right instance.
        ruralPaymentsBusiness: standardAuthRuralPaymentsBusiness.isExternalRoute()
          ? new RuralPaymentsBusiness(...internalServiceAccountDatasourceOptions)
          : null
      }
    }
  }
}
