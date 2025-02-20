import { server } from '../../../../../app/server.js'

describe('Healthy test', () => {
  beforeEach(async () => {
    await server.start()
  })

  it('GET /healthy route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toEqual(200)
  })

  afterEach(async () => {
    await server.stop()
  })
})
