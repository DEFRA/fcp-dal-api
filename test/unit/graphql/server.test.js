import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => {
  const mockApolloServer = vi.fn()
  const mockSchemaModule = { createSchema: vi.fn() }
  const mockApolloPluginDisabled = vi.fn()
  const mockApolloPluginLandingPage = vi.fn()
  const mockAuditPlugin = vi.fn()
  const mockErrorLoggingPlugin = vi.fn()
  const mockErrorCodesPlugin = vi.fn()
  const mockMappedDefraIdApolloPlugin = vi.fn(() => 'mockMappedDefraIdApolloPlugin')

  return {
    mockMappedDefraIdApolloPlugin,
    mockApolloServer,
    mockSchemaModule,
    mockApolloPluginDisabled,
    mockApolloPluginLandingPage,
    mockAuditPlugin,
    mockErrorLoggingPlugin,
    mockErrorCodesPlugin,
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
vi.mock('../../../app/graphql/plugins/error-logging.js', () => ({
  errorLoggingPlugin: mocks.mockErrorLoggingPlugin
}))
vi.mock('../../../app/graphql/plugins/error-codes.js', () => ({
  errorCodesPlugin: mocks.mockErrorCodesPlugin
}))
vi.mock('../../../app/auth/mapped-defra-id.js', () => ({
  mappedDefraIdApolloPlugin: mocks.mockMappedDefraIdApolloPlugin
}))

describe('GraphQL Dashboard test with mocks', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.mockMappedDefraIdApolloPlugin.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
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
      plugins: [
        mocks.mockApolloPluginDisabled(),
        mocks.mockAuditPlugin(),
        mocks.mockErrorLoggingPlugin(),
        mocks.mockErrorCodesPlugin()
      ],
      introspection: false,
      formatError: expect.any(Function),
      stringifyResult: expect.any(Function)
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
      plugins: [
        mocks.mockApolloPluginLandingPage(),
        mocks.mockAuditPlugin(),
        mocks.mockErrorLoggingPlugin(),
        mocks.mockErrorCodesPlugin()
      ],
      introspection: true,
      formatError: expect.any(Function),
      stringifyResult: expect.any(Function)
    })
  })

  it('only adds the mapped Defra ID plugin when a dummy CRN to SBI mapping is configured', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'false'
    vi.stubEnv('DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING', '9100000001:810000000')
    mocks.mockSchemaModule.createSchema.mockReturnValue('mockCreateSchemaRV')
    await import('../../../app/graphql/server.js')

    expect(mocks.mockMappedDefraIdApolloPlugin).toHaveBeenCalledTimes(1)
    expect(mocks.mockApolloServer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        plugins: expect.arrayContaining(['mockMappedDefraIdApolloPlugin'])
      })
    )
  })

  it('does not add the mapped Defra ID plugin without a mapping', async () => {
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'false'
    vi.stubEnv('DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING', '')
    mocks.mockSchemaModule.createSchema.mockReturnValue('mockCreateSchemaRV')
    await import('../../../app/graphql/server.js')

    expect(mocks.mockMappedDefraIdApolloPlugin).not.toHaveBeenCalled()
  })

  it('stringifies results without appending a newline', async () => {
    await import('../../../app/graphql/server.js')
    const { stringifyResult } = mocks.mockApolloServer.mock.calls.at(-1)[0]

    expect(stringifyResult({ data: { a: 1 } })).toBe('{"data":{"a":1}}')
  })
})
