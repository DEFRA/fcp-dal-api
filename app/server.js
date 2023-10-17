import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { dirname, join } from 'path'
import { loadFilesSync } from '@graphql-tools/load-files'
import { pathToFileURL, fileURLToPath } from 'url'
import hapi from '@hapi/hapi'

import { healthyRoute } from './routes/healthy.js'
import { healthzRoute } from './routes/healthz.js'
import { setupAppInsights } from './insights.js'

setupAppInsights()

const __dirname = dirname(fileURLToPath(import.meta.url))

const typeDefs = loadFilesSync(join(__dirname, 'graphql', 'types'), {
  recursive: true
})

const resolvers = loadFilesSync(join(__dirname, 'graphql', 'resolvers'), {
  recursive: true,
  requireMethod: async path => import(pathToFileURL(path))
})

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    (() => {
      if (process.env?.NODE_ENV === 'production') {
        return ApolloServerPluginLandingPageDisabled()
      }

      return ApolloServerPluginLandingPageLocalDefault()
    })()
  ]
})

export const server = hapi.server({
  port: process.env.PORT
})

const routes = [].concat(healthyRoute, healthzRoute)

server.route(routes)
