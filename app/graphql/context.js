import jwt from 'jsonwebtoken'
import { getAuth } from '../auth/authenticate.js'
import { config } from '../config.js'
import { MongoBusiness } from '../data-sources/mongo/Business.js'
import { MongoCustomer } from '../data-sources/mongo/Customer.js'
import { MongoJWKS } from '../data-sources/mongo/JWKS.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { BadRequest } from '../errors/graphql.js'
import { logger } from '../logger/logger.js'
import { db } from '../mongo.js'

const internalGatewayDevOverrideEmail = config.get('kits.internal.devOverrideEmail')

export const extractOrgIdFromDefraIdToken = (sbi, token) => {
  const { payload } = jwt.decode(token, { complete: true })
  if (payload?.relationships && Array.isArray(payload.relationships)) {
    // Find relationship string that matches the given SBI
    const relationship = payload.relationships.find((rel) => {
      const [, tokenSBI] = rel.split(':')
      return sbi === tokenSBI
    })
    if (relationship) {
      const [orgId] = relationship.split(':')
      return orgId
    }
  }
  throw new BadRequest('Defra ID token is not valid for the provided SBI')
}

export async function context({ request }) {
  const auth = await getAuth(request, new MongoJWKS({ modelOrCollection: db.collection('jwks') }))

  const requestLogger = logger.child({
    transactionId: request.transactionId,
    traceId: request.traceId
  })

  const datasourceOptions = [
    { logger: requestLogger },
    {
      request,
      gatewayType: request.headers['gateway-type'] || 'internal',
      internalGatewayDevOverrideEmail
    }
  ]

  return {
    auth,
    requestLogger,
    db,
    dataSources: {
      permissions: new Permissions({ logger: requestLogger }),
      ruralPaymentsBusiness: new RuralPaymentsBusiness(...datasourceOptions),
      ruralPaymentsCustomer: new RuralPaymentsCustomer(...datasourceOptions),
      mongoCustomer: new MongoCustomer({
        modelOrCollection: db.collection('customers')
      }),
      mongoBusiness: new MongoBusiness({
        modelOrCollection: db.collection('businesses')
      })
    }
  }
}
