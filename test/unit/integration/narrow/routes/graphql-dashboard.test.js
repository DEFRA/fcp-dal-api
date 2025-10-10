import { jest } from '@jest/globals'
import { config } from '../../../../../app/config.js'
import { apolloServer, enableApolloLandingPage } from '../../../../../app/graphql/server.js'

describe('GraphQL Dashboard test', () => {
  let configMockPath

  beforeEach(async () => {
    configMockPath = {}
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
  })

  afterEach(async () => {
    jest.restoreAllMocks()
  })
  it('expects graphql dashboard to be enabled when GRAPHQL_DASHBOARD_ENABLED is set in .env.test', async () => {
    expect(apolloServer.internals.plugins.length).toBe(1)
    expect(apolloServer.internals.plugins[0].__is_disabled_plugin__).toBeUndefined()
  })

  it('enables graphql dashboard when GRAPHQL_DASHBOARD_ENABLED is enabled', async () => {
    configMockPath.graphqlDashboardEnabled = 'true'

    const response = enableApolloLandingPage()

    expect(response.__is_disabled_plugin__).toBeUndefined()
  })

  it('disables graphql dashboard when GRAPHQL_DASHBOARD_ENABLED is disabled', async () => {
    configMockPath.graphqlDashboardEnabled = false

    const response = enableApolloLandingPage()

    expect(response.__is_disabled_plugin__).toBeDefined()
    expect(response.__is_disabled_plugin__).toBe(true)
  })
})
