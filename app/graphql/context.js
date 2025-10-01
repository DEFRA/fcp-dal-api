import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import { getAuth } from '../auth/authenticate.js'
import { config } from '../config.js'
import { MongoBusinesses } from '../data-sources/mongo/Businesses.js'
import { MongoCustomers } from '../data-sources/mongo/Customers.js'
import { RuralPaymentsBusiness } from '../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../data-sources/static/permissions.js'
import { BadRequest } from '../errors/graphql.js'
import { logger } from '../logger/logger.js'

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
  const auth = await getAuth(request)

  const client = new MongoClient(config.get('mongo.mongoUrl'), {
    retryWrites: config.get('mongo.mongoOptions.retryWrites'),
    readPreference: config.get('mongo.mongoOptions.readPreference')
  })
  client.connect()

  const requestLogger = logger.child({
    transactionId: request.transactionId,
    traceId: request.traceId
  })

  const datasourceOptions = [
    { logger: requestLogger },
    {
      request,
      gatewayType: request.headers['gateway-type'] || 'internal'
    }
  ]

  return {
    auth,
    requestLogger,
    dataSources: {
      permissions: new Permissions({ logger: requestLogger }),
      ruralPaymentsBusiness: new RuralPaymentsBusiness(...datasourceOptions),
      ruralPaymentsCustomer: new RuralPaymentsCustomer(...datasourceOptions),
      mongoCustomers: new MongoCustomers({
        modelOrCollection: client.db(config.get('mongo.databaseName')).collection('customers')
      }),
      mongoBusinesses: new MongoBusinesses({
        modelOrCollection: client.db(config.get('mongo.databaseName')).collection('businesses')
      })
    }
  }
}
