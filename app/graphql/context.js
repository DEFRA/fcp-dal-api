import { RuralPaymentsPortalApi } from '../data-sources/rural-payments-portal/RuralPaymentsPortalApi.js'
import { getAuth } from '../auth/authenticate.js'
import { Authorize } from '../auth/authorize.js'

export async function context ({ request }) {
  const auth = await getAuth(request)
  return {
    authorize: new Authorize(
      { adGroups: auth.groups || [] }
    ),
    auth,
    dataSources: {
      ruralPaymentsPortalApi: new RuralPaymentsPortalApi()
    }
  }
}
