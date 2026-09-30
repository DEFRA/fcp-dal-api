import { config } from '../../../app/config.js'
import { createSchema } from '../../../app/graphql/schema.js'

describe('GraphQL schema', () => {
  const cdpEnv = config.get('cdp.env')
  const authDisabled = config.get('auth.disabled')

  it('should create a schema without throwing an error', async () => {
    await expect(createSchema()).resolves.not.toThrow()
  })

  describe('when auth is disabled and the cdp env is not dev', () => {
    // temporarily set auth to enabled for this test
    beforeAll(() => {
      config.set('auth.disabled', true)
      config.set('cdp.env', 'test')
    })

    // reset to original state after import
    afterAll(() => {
      config.set('auth.disabled', authDisabled)
      config.set('cdp.env', cdpEnv) // reset to original state after import
    })

    it('should throw an error to guard higher environments', async () => {
      await expect(createSchema()).rejects.toThrow('Cannot disable auth outside of dev environment')
    })
  })
})
