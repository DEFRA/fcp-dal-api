import { faker } from '@faker-js/faker/locale/en_GB'

import mockServer from './mocks/server'

if (process.env.ENABLE_MOCK_SERVER) {
  beforeAll(async () => {
    faker.seed(5109389384975743)
    await mockServer.start()
  })
  afterAll(mockServer.stop)
}
