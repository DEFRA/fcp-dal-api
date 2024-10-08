import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { createSchema } from './schema.js'

export const schema = await createSchema()

export const apolloServer = new ApolloServer({
  schema,
  plugins: [
    (() => {
      if (process.env?.NODE_ENV === 'production') {
        return ApolloServerPluginLandingPageDisabled()
      }

      return ApolloServerPluginLandingPageLocalDefault()
    })()
  ],
  formatError: (formattedError, _error) => {
    const responseError = {
      message: formattedError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      statusCode: formattedError?.extensions?.response?.status
    }

    if (process.env.NODE_ENV === 'development') {
      responseError.extensions = formattedError.extensions
    }

    return responseError
  }
})
