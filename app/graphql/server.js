import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { mappedDefraIdApolloPlugin } from '../auth/mapped-defra-id.js'
import { config, dummyCrnToSbiMapping } from '../config.js'
import { formatError } from './formatError.js'
import { createSchema } from './schema.js'
import { auditPlugin } from './plugins/audit.js'
import { errorCodesPlugin } from './plugins/error-codes.js'
import { errorLoggingPlugin } from './plugins/error-logging.js'

export const schema = await createSchema()

export const enableApolloLandingPage = () => {
  if (config.get('graphqlDashboardEnabled')) {
    return ApolloServerPluginLandingPageLocalDefault()
  }

  return ApolloServerPluginLandingPageDisabled()
}

export const apolloServer = new ApolloServer({
  schema,
  plugins: [
    enableApolloLandingPage(),
    auditPlugin(),
    errorLoggingPlugin(),
    errorCodesPlugin(),
    // Only enabled in dev/test. Used to map dummy Defra ID CRNs onto actual businesses.
    ...(dummyCrnToSbiMapping.size ? [mappedDefraIdApolloPlugin()] : [])
  ],
  introspection: config.get('graphqlDashboardEnabled'),
  formatError,
  // Apollo's default appends '\n' to the JSON, creating a concatenated string that V8 must flatten
  // into a second full-size copy before it can be written - significant for large (e.g. ~50MB
  // land geometries) responses.
  stringifyResult: (value) => JSON.stringify(value)
})
