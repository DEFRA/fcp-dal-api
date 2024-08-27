import { apolloServer } from './server.js'
import { AuthenticateDatabase } from '../data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../data-sources/entra-id/EntraIdApi.js'
import { getAuth } from '../auth/authenticate.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { RuralPaymentsPortalApi } from '../data-sources/rural-payments-portal/RuralPaymentsPortalApi.js'

export async function context ({ request }) {
  const auth = await getAuth(request)
  return {
    auth,
    dataSources: {
      authenticateDatabase: new AuthenticateDatabase(),
      entraIdApi: new EntraIdApi({ cache: apolloServer.cache }),
      permissions: new Permissions(),
      ruralPaymentsBusiness: new RuralPaymentsBusiness(),
      ruralPaymentsCustomer: new RuralPaymentsCustomer(),
      ruralPaymentsPortalApi: new RuralPaymentsPortalApi()
    }
  }
}
