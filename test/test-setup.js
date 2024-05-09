import { jest } from '@jest/globals'

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
