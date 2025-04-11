import Core from '@mocks-server/core'
import collections from './collections.js'
import { MTLSServer } from './mtls-server.js'
import { routes } from './routes/index.js'

const logLevel = process.env.MOCK_LOG_LEVEL || 'silent'

const server = new Core({
  log: logLevel,
  server: {
    https: { enabled: !!(process.env.MOCK_SERVER_CERT && process.env.MOCK_SERVER_KEY) },
    port: Number(process.env.MOCK_SERVER_PORT || 3100)
  },
  config: {
    allowUnknownArguments: true,
    readArguments: true,
    readEnvironment: true,
    readFile: false
  },
  files: {
    enabled: false
  },
  mock: {
    collections: {
      selected: 'all'
    }
  }
})

const mtlsServer = new MTLSServer({
  config: server._config.addNamespace('mtls-sever'),
  logger: server._logger.namespace(MTLSServer.id),
  alerts: server._alerts.collection(MTLSServer.id),
  routesRouter: server._mock.router
})
server._server = mtlsServer

export default {
  start: async () => {
    await server.start()

    const { loadRoutes, loadCollections } = server.mock.createLoaders()
    loadRoutes(routes)
    loadCollections(collections)

    return server.server.url
  },
  stop: async () => server.stop(),
  selectBase: (base) => server.mock.collections.select(base),
  server
}
