import { jest } from '@jest/globals'

describe('GraphQL Dashboard test with mocks', () => {
  const mockApolloServer = jest.fn()
  const mockApolloModule = {
    ApolloServer: mockApolloServer
  }
  jest.unstable_mockModule('@apollo/server', () => mockApolloModule)

  const mockSchemaModule = {
    createSchema: jest.fn()
  }
  jest.unstable_mockModule('../../../app/graphql/schema.js', () => mockSchemaModule)

  const mockApolloPluginDisabled = jest.fn()
  const mockApolloPluginDisabledModule = {
    ApolloServerPluginLandingPageDisabled: mockApolloPluginDisabled
  }
  jest.unstable_mockModule('@apollo/server/plugin/disabled', () => mockApolloPluginDisabledModule)

  const mockApolloPluginLandingPage = jest.fn()
  const mockApolloPluginLandingPageModule = {
    ApolloServerPluginLandingPageLocalDefault: mockApolloPluginLandingPage
  }
  jest.unstable_mockModule(
    '@apollo/server/plugin/landingPage/default',
    () => mockApolloPluginLandingPageModule
  )

  const mockAuditPlugin = jest.fn()
  jest.unstable_mockModule('../../../app/graphql/plugins/audit.js', () => ({
    auditPlugin: mockAuditPlugin
  }))

  beforeEach(() => {
    jest.resetModules()
  })

  it('expect ApolloServer to have been called with correct args to disable landing page', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'false'
    mockSchemaModule.createSchema.mockReturnValue('mockCreateSchemaRV')
    const { apolloServer } = await import('../../../app/graphql/server.js')

    expect(apolloServer).toBeDefined()
    expect(mockSchemaModule.createSchema).toHaveBeenCalledTimes(1)
    expect(mockSchemaModule.createSchema).toHaveBeenCalledWith()

    expect(mockApolloPluginDisabled).toHaveBeenCalledTimes(1)
    expect(mockApolloPluginDisabled).toHaveBeenCalledWith()

    expect(mockApolloPluginLandingPage).not.toHaveBeenCalled()
    expect(mockAuditPlugin).toHaveBeenCalledTimes(1)
    expect(mockAuditPlugin).toHaveBeenCalledWith()
    expect(mockApolloServer).toHaveBeenCalledWith({
      schema: 'mockCreateSchemaRV',
      plugins: [mockApolloPluginDisabled(), mockAuditPlugin()],
      introspection: false,
      formatError: expect.any(Function)
    })
  })

  it('expect ApolloServer to have been called with correct args to enable landing page', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'true'
    mockSchemaModule.createSchema.mockReturnValue('mockCreateSchemaRV')
    const { apolloServer } = await import('../../../app/graphql/server.js')

    expect(apolloServer).toBeDefined()

    expect(mockSchemaModule.createSchema).toHaveBeenCalledTimes(1)
    expect(mockSchemaModule.createSchema).toHaveBeenCalledWith()

    expect(mockApolloPluginDisabled).not.toHaveBeenCalled()

    expect(mockApolloPluginLandingPage).toHaveBeenCalledTimes(1)
    expect(mockApolloPluginLandingPage).toHaveBeenCalledWith()

    expect(mockAuditPlugin).toHaveBeenCalledTimes(1)
    expect(mockAuditPlugin).toHaveBeenCalledWith()

    expect(mockApolloServer).toHaveBeenCalledWith({
      schema: 'mockCreateSchemaRV',
      plugins: [mockApolloPluginLandingPage(), mockAuditPlugin()],
      introspection: true,
      formatError: expect.any(Function)
    })
  })
})
