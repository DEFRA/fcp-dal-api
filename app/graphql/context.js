import { getAuth } from '../auth/authenticate.js'
import { Authorize } from '../auth/authorize.js'
import { AuthenticateDatabase } from '../data-sources/authenticate/AuthenticateDatabase.js'
import { RuralPaymentsPortalApi } from '../data-sources/rural-payments-portal/RuralPaymentsPortalApi.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'

export async function context ({ request }) {
  const auth = await getAuth(request)
  return {
    authorize: new Authorize({ adGroups: auth.groups || [] }),
    auth,
    dataSources: {
      ruralPaymentsPortalApi: new RuralPaymentsPortalApi(),
      authenticateDatabase: new AuthenticateDatabase(),
      permissions: new Permissions(),
      ruralPaymentsCustomer: new RuralPaymentsCustomer(),
      ruralPaymentsBusiness: new RuralPaymentsBusiness()
    }
  }
}
