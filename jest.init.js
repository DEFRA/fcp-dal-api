import mockServer from './mocks/server'

if (process.env.ENABLE_MOCK_SERVER) {
  beforeAll(async () => {
    await mockServer.start()
  })
  afterAll(mockServer.stop)
}
