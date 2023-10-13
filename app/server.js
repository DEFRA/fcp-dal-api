const path = require('path')

require('./insights').setup()
const Hapi = require('@hapi/hapi')
const  ApolloServer = require('@apollo/server');
const graphql =  require('@graphql-tools/load-files')
const { ApolloServerPluginLandingPageDisabled } = require('@apollo/server/plugin/disabled');
const { ApolloServerPluginLandingPageLocalDefault } = require("@apollo/server/plugin/landingPage/default");

const typeDefs = graphql.loadFilesSync(
  path.join(__dirname, 'graphql', 'types'),
  { recursive: true }
)

const resolvers = graphql.loadFilesSync(
  path.join(__dirname, 'graphql', 'resolvers'),
  { recursive: true }
)

const apolloServer = new ApolloServer.ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    (() => {
      if (process.env?.NODE_ENV === 'production') {
        return ApolloServerPluginLandingPageDisabled()
      }

      return ApolloServerPluginLandingPageLocalDefault()
    })(),
  ],
});


const server = Hapi.server({
  port: process.env.PORT
})

const routes = [].concat(
  require('./routes/healthy'),
  require('./routes/healthz')
)

server.route(routes)

module.exports = {
  apolloServer,
  server
}
