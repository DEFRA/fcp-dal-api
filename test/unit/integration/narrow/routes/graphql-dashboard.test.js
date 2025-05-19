import { apolloServer, enableApolloLandingPage } from '../../../../../app/graphql/server.js'

describe('GraphQL Dashboard test', () => {
  it('expects graphql dashboard to be enabled when GRAPHQL_DASHBOARD_ENABLED is set in .env.test', async () => {
    expect(apolloServer.internals.plugins.length).toBe(1)
    expect(apolloServer.internals.plugins[0].__is_disabled_plugin__).toBeUndefined()
  })

  it('enables graphql dashboard when GRAPHQL_DASHBOARD_ENABLED is enabled', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'true'

    const response = enableApolloLandingPage()

    expect(response.__is_disabled_plugin__).toBeUndefined()
  })

  it('disables graphql dashboard when GRAPHQL_DASHBOARD_ENABLED is disabled', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'false'

    const response = enableApolloLandingPage()

    expect(response.__is_disabled_plugin__).toBeDefined()
    expect(response.__is_disabled_plugin__).toBe(true)
  })
})
