import { jest } from '@jest/globals'

// This needs to be done prior to any imports that may reference it
jest.unstable_mockModule('jwks-rsa', () => ({
  __esModule: true,
  default: () => ({
    getSigningKey: () => ({
      getPublicKey: () => 'secret'
    })
  })
}))

global.jest = jest

const { context } = await import('../app/graphql/context.js')

export const fakeContext = {
  ...await context({}),
  authorize: { checkAuthGroup: () => [process.env.ADMIN] }
}
