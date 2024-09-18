import hapiApollo from '@as-integrations/hapi'

import { context } from './graphql/context.js'
import { apolloServer } from './graphql/server.js'
import { FCP_UNHANDLED_ERROR_001 } from './logger/codes.js'
import { logger } from './logger/logger.js'
import { server } from './server.js'

const init = async () => {
  await apolloServer.start()

  await server.register({
    plugin: hapiApollo.default,
    options: {
      context,
      apolloServer,
      path: '/graphql'
    }
  })

  await server.start()
  logger.health(`Server running on ${server.info.uri}`, { code: FCP_UNHANDLED_ERROR_001 })
}

process.on('unhandledRejection', error => {
  logger.error('#unhandledRejection', { error, code: FCP_UNHANDLED_ERROR_001 })
  process.exit(1)
})

process.on('uncaughtException', error => {
  logger.error('#uncaughtException', { error, code: FCP_UNHANDLED_ERROR_001 })
  process.exit(1)
})

init()
