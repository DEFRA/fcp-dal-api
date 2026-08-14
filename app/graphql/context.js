import { getAuth, getRequestingGroup, getRequestingService } from '../auth/authenticate.js'
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
import { endUserAuthContext } from '../auth/end-user-auth-context.js'
import { createAuditTrail } from '../audit/audit-trail.js'

function stripClientSuppliedServiceAccountHeader(request) {
  // Service account foundations have been added, to support the DAL internal service account, but this is not
  // ready for client-use. Strip any client-supplied header so a caller can never masquerade as the DAL service
  // account. This temporary guard should be removed as service account support is rolled out.
  delete request.headers['service-account']
}

export async function context({ request }) {
  const auth = await getAuth(request, new JWKS())
  const requestingService = getRequestingService(auth.groups ?? [])
  // Following the pattern used by transactionId and traceId
  request.requestingService = requestingService

  const requestLogger = logger.child({
    transactionId: request.transactionId,
    traceId: request.traceId,
    ...(requestingService && { tenant: { id: requestingService } })
  })

  stripClientSuppliedServiceAccountHeader(request)

  const datasourceOptions = [
    { logger: requestLogger },
    {
      request
    }
  ]

  const auditTrail = createAuditTrail()
  const authContext = endUserAuthContext(request)
  const internalServiceAccountDatasourceOptions = [
    { logger: requestLogger },
    {
      request: {
        ...request,
        headers: {
          ...request.headers,
          'service-account': authContext.serviceAccount || config.get('kits.dalServiceAccountEmail')
        }
      }
    }
  ]

  const standardAuthRuralPaymentsBusiness = new RuralPaymentsBusiness(...datasourceOptions)

  return {
    auth,
    request,
    requestLogger,
    auditTrail,
    db,
    dataSources: {
      permissions: new Permissions({ logger: requestLogger }),
      ruralPaymentsBusiness: standardAuthRuralPaymentsBusiness,
      ruralPaymentsCustomer: new RuralPaymentsCustomer(...datasourceOptions),
      ruralPaymentsReferenceData: new RuralPaymentsReferenceData(...datasourceOptions),
      hitachiPayments: new HitachiPayments({
        logger: requestLogger,
        audit: {
          requestedSystem: getRequestingGroup(auth.groups),
          requesterId: request.headers.email,
          correlationId: request.traceId
        }
      }),
      mongoCustomer: new MongoCustomer({
        modelOrCollection: db.collection('customers')
      }),
      mongoBusiness: new MongoBusiness({
        modelOrCollection: db.collection('businesses')
      }),
      serviceAccount: {
        // Service account only currently supported for ruralPaymentsBusiness.  Other ruralPayments datasources
        // should be added here too if the need arises, alongside a getXXXDataSource-style helper (see
        // getRuralPaymentsBusinessDataSource in resolvers/business/common.js) for resolvers to pick the right instance.
        ruralPaymentsBusiness: standardAuthRuralPaymentsBusiness.isExternalRoute()
          ? new RuralPaymentsBusiness(...internalServiceAccountDatasourceOptions)
          : null
      }
    }
  }
}
