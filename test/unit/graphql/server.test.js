import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => {
  const mockApolloServer = vi.fn()
  const mockSchemaModule = { createSchema: vi.fn() }
  const mockApolloPluginDisabled = vi.fn()
  const mockApolloPluginLandingPage = vi.fn()
  const mockAuditPlugin = vi.fn()

  return {
    mockApolloServer,
    mockSchemaModule,
    mockApolloPluginDisabled,
    mockApolloPluginLandingPage,
    mockAuditPlugin,
    mockApolloModule: { ApolloServer: mockApolloServer },
    mockApolloPluginDisabledModule: {
      ApolloServerPluginLandingPageDisabled: mockApolloPluginDisabled
    },
    mockApolloPluginLandingPageModule: {
      ApolloServerPluginLandingPageLocalDefault: mockApolloPluginLandingPage
    }
  }
})

vi.mock('@apollo/server', () => mocks.mockApolloModule)
vi.mock('../../../app/graphql/schema.js', () => mocks.mockSchemaModule)
vi.mock('@apollo/server/plugin/disabled', () => mocks.mockApolloPluginDisabledModule)
vi.mock('@apollo/server/plugin/landingPage/default', () => mocks.mockApolloPluginLandingPageModule)
vi.mock('../../../app/graphql/plugins/audit.js', () => ({
  auditPlugin: mocks.mockAuditPlugin
}))

describe('GraphQL Dashboard test with mocks', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
  })

  it('expect ApolloServer to have been called with correct args to disable landing page', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'false'
    mocks.mockSchemaModule.createSchema.mockReturnValue('mockCreateSchemaRV')
    const { apolloServer } = await import('../../../app/graphql/server.js')

    expect(apolloServer).toBeDefined()
    expect(mocks.mockSchemaModule.createSchema).toHaveBeenCalledTimes(1)
    expect(mocks.mockSchemaModule.createSchema).toHaveBeenCalledWith()

    expect(mocks.mockApolloPluginDisabled).toHaveBeenCalledTimes(1)
    expect(mocks.mockApolloPluginDisabled).toHaveBeenCalledWith()

    expect(mocks.mockApolloPluginLandingPage).not.toHaveBeenCalled()
    expect(mocks.mockAuditPlugin).toHaveBeenCalledTimes(1)
    expect(mocks.mockAuditPlugin).toHaveBeenCalledWith()
    expect(mocks.mockApolloServer).toHaveBeenCalledWith({
      schema: 'mockCreateSchemaRV',
      plugins: [mocks.mockApolloPluginDisabled(), mocks.mockAuditPlugin()],
      introspection: false,
      formatError: expect.any(Function)
    })
  })

  it('expect ApolloServer to have been called with correct args to enable landing page', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'true'
    mocks.mockSchemaModule.createSchema.mockReturnValue('mockCreateSchemaRV')
    const { apolloServer } = await import('../../../app/graphql/server.js')

    expect(apolloServer).toBeDefined()

    expect(mocks.mockSchemaModule.createSchema).toHaveBeenCalledTimes(1)
    expect(mocks.mockSchemaModule.createSchema).toHaveBeenCalledWith()

    expect(mocks.mockApolloPluginDisabled).not.toHaveBeenCalled()

    expect(mocks.mockApolloPluginLandingPage).toHaveBeenCalledTimes(1)
    expect(mocks.mockApolloPluginLandingPage).toHaveBeenCalledWith()

    expect(mocks.mockAuditPlugin).toHaveBeenCalledTimes(1)
    expect(mocks.mockAuditPlugin).toHaveBeenCalledWith()

    expect(mocks.mockApolloServer).toHaveBeenCalledWith({
      schema: 'mockCreateSchemaRV',
      plugins: [mocks.mockApolloPluginLandingPage(), mocks.mockAuditPlugin()],
      introspection: true,
      formatError: expect.any(Function)
    })
  })
})
