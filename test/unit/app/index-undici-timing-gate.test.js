import { expect, jest } from '@jest/globals'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const mockRunHealthChecks = jest.fn()
const mockRegisterConnectTiming = jest.fn()
const mockRegisterResponseTiming = jest.fn()

jest.unstable_mockModule('../../../app/logger/logger.js', () => mockLogger)
jest.unstable_mockModule('../../../app/utils/health/index.js', () => ({
  runHealthChecks: mockRunHealthChecks
}))
jest.unstable_mockModule('../../../app/instrumentation/undiciConnectTiming.js', () => ({
  registerConnectTiming: mockRegisterConnectTiming
}))
jest.unstable_mockModule('../../../app/instrumentation/undiciResponseTiming.js', () => ({
  registerResponseTiming: mockRegisterResponseTiming
}))

const { apolloServer } = await import('../../../app/graphql/server.js')
const { server } = await import('../../../app/server.js')
const { mongoClient } = await import('../../../app/mongo.js')
const { config } = await import('../../../app/config.js')

describe('App initialization - undici timing registration gate', () => {
  const originalConfigGet = config.get.bind(config)

  const mockConfig = (connectTimingEnabled) => {
    jest
      .spyOn(config, 'get')
      .mockImplementation((key) =>
        key === 'kits.external.connectTimingEnabled' ? connectTimingEnabled : originalConfigGet(key)
      )
  }

  beforeEach(() => {
    jest.spyOn(apolloServer, 'start').mockResolvedValue()
    jest.spyOn(server, 'register').mockResolvedValue()
    jest.spyOn(server, 'start').mockResolvedValue()
    jest.spyOn(server, 'stop').mockResolvedValue()
    jest.spyOn(mongoClient, 'close').mockResolvedValue()
    mockRunHealthChecks.mockResolvedValue()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockRegisterConnectTiming.mockClear()
    mockRegisterResponseTiming.mockClear()
  })

  it('registers connect and response timing when the flag is enabled', async () => {
    mockConfig(true)

    await import(`../../../app/index.js?update=${Date.now()}`)

    expect(mockRegisterConnectTiming).toHaveBeenCalled()
    expect(mockRegisterResponseTiming).toHaveBeenCalled()
  })

  it('registers neither when the flag is disabled', async () => {
    mockConfig(false)

    await import(`../../../app/index.js?update=${Date.now()}`)

    expect(mockRegisterConnectTiming).not.toHaveBeenCalled()
    expect(mockRegisterResponseTiming).not.toHaveBeenCalled()
  })
})
