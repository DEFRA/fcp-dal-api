import { getAuth } from '../auth/authenticate.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { logger } from '../logger/logger.js'

export async function context({ request }) {
  const auth = await getAuth(request)

  const requestLogger = logger.child({ requestId: request.id })

  return {
    auth,
    requestLogger,
    dataSources: {
      permissions: new Permissions({ logger: requestLogger }),
      ruralPaymentsBusiness: new RuralPaymentsBusiness({ logger: requestLogger }, request),
      ruralPaymentsCustomer: new RuralPaymentsCustomer({ logger: requestLogger }, request)
    }
  }
}
