import hapiApollo from '@as-integrations/hapi'
import tls from 'node:tls'

import { secureContext } from '@defra/hapi-secure-context'

import { context } from './graphql/context.js'
import { apolloServer } from './graphql/server.js'
import { DAL_UNHANDLED_ERROR_001 } from './logger/codes.js'
import { logger } from './logger/logger.js'
import { mongoClient } from './mongo.js'
import { server } from './server.js'
import { runHealthChecks } from './utils/health/index.js'

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

  await runHealthChecks()

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
  logger.error('#DAL - uncaught exception', { error, code: DAL_UNHANDLED_ERROR_001 })
  await abort()
})

await init()
