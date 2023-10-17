import hapiApollo from '@as-integrations/hapi'

import { apolloServer, server } from './server.js'

const init = async () => {
  await apolloServer.start()
  await server.register({
    plugin: hapiApollo.default,
    options: {
      context: async ({ request }) => ({
        headers: request.headers
      }),
      apolloServer,
      path: '/graphql'
    }
  })

  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})

init()
