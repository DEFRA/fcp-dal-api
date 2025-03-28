import Core from '@mocks-server/core'
import collections from './collections.js'
import { routes } from './routes/index.js'

const logLevel = process.env.MOCK_LOG_LEVEL || 'silent'

const server = new Core({
  log: logLevel,
  server: {
    port: Number(process.env.PORT_MOCK || 3100)
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
