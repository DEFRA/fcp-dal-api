import { getAuth } from '../auth/authenticate.js'
import { AuthenticateDatabase } from '../data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../data-sources/entra-id/EntraIdApi.js'
import { RuralPaymentsPortalApi } from '../data-sources/rural-payments-portal/RuralPaymentsPortalApi.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { logger } from '../logger/logger.js'
import { apolloServer } from './server.js'

const authenticateDatabase = new AuthenticateDatabase()
const permissions = new Permissions()

export async function context ({ request }) {
  const auth = await getAuth(request)
  return {
    auth,
    dataSources: {
      authenticateDatabase,
      entraIdApi: new EntraIdApi({ cache: apolloServer.cache }),
      permissions,
      ruralPaymentsBusiness: new RuralPaymentsBusiness({ logger }, request),
      ruralPaymentsCustomer: new RuralPaymentsCustomer({ logger }, request),
      ruralPaymentsPortalApi: new RuralPaymentsPortalApi()
    }
  }
}
