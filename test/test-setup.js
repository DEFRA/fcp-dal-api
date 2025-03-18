import { jest } from '@jest/globals'

global.jest = jest

const { context } = await import('../app/graphql/context.js')
const request = { headers: { email: 'test@defra.gov.uk' } }
const contextObject = await context({ request })

export const fakeContext = {
  ...contextObject,
  auth: { groups: [process.env.ADMIN_AD_GROUP_ID] }
}
