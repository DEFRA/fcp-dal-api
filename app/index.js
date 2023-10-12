const { server, apolloServer } = require('./server')
const hapiApollo = require('@as-integrations/hapi').default

const init = async () => {
  await apolloServer.start()
  await server.register({
    plugin: hapiApollo,
    options: {
      apolloServer,
      path: '/graphql',
    }
  })

  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

init()
