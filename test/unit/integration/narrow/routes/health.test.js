import { server } from '../../../../../app/server.js'

describe('Healthz test', () => {
  beforeEach(async () => {
    await server.start()
  })

  it('GET /health route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/health'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toEqual(200)
  })

  afterEach(async () => {
    await server.stop()
  })
})
