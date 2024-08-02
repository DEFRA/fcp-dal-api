import { getAuth } from '../auth/authenticate.js'
import { Authorize } from '../auth/authorize.js'
import { AuthenticateDatabase } from '../data-sources/authenticate/AuthenticateDatabase.js'
import { RuralPaymentsPortalApi } from '../data-sources/rural-payments-portal/RuralPaymentsPortalApi.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { VersionOneBusiness } from '../data-sources/version-one/business.js'
import { VersionOneCustomer } from '../data-sources/version-one/customer.js'

export async function context ({ request }) {
  const auth = await getAuth(request)
  return {
    authorize: new Authorize(
      { adGroups: auth.groups || [] }
    ),
    auth,
    dataSources: {
      ruralPaymentsPortalApi: new RuralPaymentsPortalApi(),
      authenticateDatabase: new AuthenticateDatabase(),
      permissions: new Permissions(),
      versionOneCustomer: new VersionOneCustomer(),
      versionOneBusiness: new VersionOneBusiness()
    }
  }
}
