import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { config } from '../config.js'
import { createSchema } from './schema.js'

export const schema = await createSchema()

export const enableApolloLandingPage = () => {
  if (config.get('graphqlDashboardEnabled')) {
    return ApolloServerPluginLandingPageLocalDefault()
  }

  return ApolloServerPluginLandingPageDisabled()
}

export const apolloServer = new ApolloServer({
  schema,
  plugins: [enableApolloLandingPage()],
  introspection: config.get('graphqlDashboardEnabled')
})
