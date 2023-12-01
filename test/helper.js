import mockServer from '../mocks/server.js'

if (process.env.ENABLE_MOCK_SERVER) {
  before(mockServer.start)
  after(mockServer.stop)
}
