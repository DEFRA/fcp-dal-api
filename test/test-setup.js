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
const contextObject = await context({})

export const fakeContext = {
  ...contextObject,
  dataSources: {
    ...contextObject.dataSources,
    authenticateDatabase: {
      getAuthenticateQuestionsAnswersByCRN: jest.fn()
    }
  },
  authorize: { checkAuthGroup: () => [process.env.ADMIN] }
}
