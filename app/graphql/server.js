import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { createSchema } from './schema.js'

export const schema = await createSchema()

export const enableApolloLandingPage = () => {
  if (process.env.GRAPHQL_DASHBOARD_ENABLED === 'true') {
    return ApolloServerPluginLandingPageLocalDefault()
  }

  return ApolloServerPluginLandingPageDisabled()
}

export const apolloServer = new ApolloServer({
  schema,
  plugins: [enableApolloLandingPage()],
  introspection: process.env.GRAPHQL_DASHBOARD_ENABLED === 'true'
})
