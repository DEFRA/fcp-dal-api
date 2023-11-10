import { server } from '../../../../app/server.js'
import { equal } from 'assert'

describe('Healthz test', () => {
  beforeEach(async () => {
    await server.start()
  })

  it('GET /healthz route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthz'
    }

    const response = await server.inject(options)
    equal(response.statusCode, 200)
  })

  afterEach(async () => {
    await server.stop()
  })
})
