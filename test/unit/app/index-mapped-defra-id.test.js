import { afterAll, describe, expect, it, vi } from 'vitest'

// DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING is read when config is first imported, so set it before any
// app module is loaded
vi.stubEnv('DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING', '9100000001:810000000')

vi.doMock('../../../app/utils/health/index.js', () => ({ runHealthChecks: vi.fn() }))

const { apolloServer } = await import('../../../app/graphql/server.js')
const { server } = await import('../../../app/server.js')
const { mappedDefraIdHapiPlugin } = await import('../../../app/auth/mapped-defra-id.js')

describe('App initialization with a dummy CRN to SBI mapping', () => {
  afterAll(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('registers the mapped Defra ID hapi plugin', async () => {
    vi.spyOn(apolloServer, 'start').mockResolvedValue()
    vi.spyOn(server, 'register').mockResolvedValue()
    vi.spyOn(server, 'start').mockResolvedValue()
    server.info = { uri: 'http://localhost:3000' }

    await import('../../../app/index.js')

    expect(server.register).toHaveBeenCalledWith(mappedDefraIdHapiPlugin)
  })
})
