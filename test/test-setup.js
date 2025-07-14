import { jest } from '@jest/globals'
import { config } from '../app/config.js'

global.jest = jest

const { context } = await import('../app/graphql/context.js')
const request = { headers: { email: 'test@defra.gov.uk' }, id: '123' }
const contextObject = await context({ request })

export const fakeContext = {
  ...contextObject,
  auth: { groups: [config.get('auth.groups.ADMIN')] }
}
