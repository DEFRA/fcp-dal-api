import hapiApollo from '@as-integrations/hapi'
import tls from 'node:tls'

import { secureContext } from '@defra/hapi-secure-context'

import { context } from './graphql/context.js'
import { apolloServer } from './graphql/server.js'
import {
  DAL_UNHANDLED_ERROR_001,
  JWKS_FETCH_ERROR_001,
  MONGO_DB_ERROR_001
} from './logger/codes.js'
import { logger } from './logger/logger.js'
import { mongoClient } from './mongo.js'
import { server } from './server.js'
import { MongoJWKS } from './data-sources/mongo/JWKS.js'
import { config } from './config.js'

const init = async () => {
  await apolloServer.start()
  await server.register([
    secureContext,
    {
      plugin: hapiApollo.default,
      options: {
        context,
        apolloServer,
        path: '/graphql'
      }
    }
  ])

  mongoClient.secureContext = tls.createSecureContext()
  try {
    await mongoClient.connect() // Test mongo connection
    logger.info('Connected to MongoDB')
  } catch (err) {
    logger.error('#DAL - Error connecting to MongoDB', { error: err, code: MONGO_DB_ERROR_001 })
    process.exit(1)
  }

  try {
    const keyInfo = await fetch(config.get('oidc.jwksURI')).then((res) => res.json())
    logger.info('Fetched JWKS keys', { keyCount: keyInfo.keys.length })

    const jwks = new MongoJWKS(mongoClient.db().collection('jwks'))
    const key = await jwks.fetchPublicKey(keyInfo.keys[0].kid)
    if (key.startsWith('-----BEGIN PUBLIC KEY-----')) {
      logger.info('Cached first JWKS key successfully')
    } else {
      throw new Error('Invalid public key format')
    }
  } catch (err) {
    logger.error('#DAL - Error fetching JWKS keys', { error: err, code: JWKS_FETCH_ERROR_001 })
    process.exit(1)
  }

  // TODO: add KITS internal/external connection tests

  await server.start()

  logger.info(`Server running on ${server.info.uri}`)
}

const abort = async () => {
  await Promise.allSettled([mongoClient.close(), server.stop()])
  process.exit(1)
}

process.on('unhandledRejection', async (error) => {
  logger.error('#DAL - unhandled rejection', { error, code: DAL_UNHANDLED_ERROR_001 })
  await abort()
})

process.on('uncaughtException', async (error) => {
  logger.error('#DAL - uncaught reception', { error, code: DAL_UNHANDLED_ERROR_001 })
  await abort()
})

init()
