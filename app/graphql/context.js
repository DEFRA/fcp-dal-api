import { getAuth } from '../auth/authenticate.js'
import { AuthenticateDatabase } from '../data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../data-sources/entra-id/EntraIdApi.js'
import { RuralPaymentsPortalApi } from '../data-sources/rural-payments-portal/RuralPaymentsPortalApi.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { logger } from '../logger/logger.js'
import { apolloServer } from './server.js'

export async function context ({ request }) {
  const auth = await getAuth(request)

  const requestLogger = logger.child({ requestId: request.id })

  return {
    auth,
    dataSources: {
      authenticateDatabase: new AuthenticateDatabase({ logger: requestLogger }),
      entraIdApi: new EntraIdApi({ cache: apolloServer.cache, logger: requestLogger }),
      permissions: new Permissions({ logger: requestLogger }),
      ruralPaymentsBusiness: new RuralPaymentsBusiness({ logger: requestLogger }, request),
      ruralPaymentsCustomer: new RuralPaymentsCustomer({ logger: requestLogger }, request),
      ruralPaymentsPortalApi: new RuralPaymentsPortalApi()
    }
  }
}
