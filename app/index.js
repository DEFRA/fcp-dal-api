import hapiApollo from '@as-integrations/hapi'

import { context } from './graphql/context.js'
import { apolloServer } from './graphql/server.js'
import { server } from './server.js'
import { logger } from './utils/logger.js'

let mockServer
if (process.env.ENABLE_MOCK_SERVER) {
  mockServer = await import('../mocks/server.js')
}

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
  logger.info(`Server running on ${server.info.uri}`)

  if (process.env.ENABLE_MOCK_SERVER && mockServer) {
    const url = await mockServer.default.start()
    logger.info(`Mock server running ${url}`)
  }
}

process.on('unhandledRejection', err => {
  logger.error('#unhandledRejection', { err })
  process.exit(1)
})

init()
