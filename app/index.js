import hapiApollo from '@as-integrations/hapi'

import { server } from './server.js'
import { apolloServer } from './graphql/server.js'
import { context } from './graphql/context.js'
import mockServer from '../mocks/server.js'

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
  console.log('Server running on %s', server.info.uri)

  if (process.env.ENABLE_MOCK_SERVER) {
    const url = await mockServer.start(server)
    console.log('Mock server running %s', url)
  }
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})

init()
