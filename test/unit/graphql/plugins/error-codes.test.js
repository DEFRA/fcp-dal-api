import { ApolloServer } from '@apollo/server'
import { describe, expect, test } from 'vitest'
import { NotFound } from '../../../../app/errors/graphql.js'
import { formatError } from '../../../../app/graphql/formatError.js'
import { errorCodesPlugin } from '../../../../app/graphql/plugins/error-codes.js'

const typeDefs = `#graphql
  type Query {
    ok: String
    missing: String
    alsoMissing: String
    broken: String
    echo(sbi: Int!): String
  }
`

const resolvers = {
  Query: {
    ok: () => 'fine',
    missing: () => {
      throw new NotFound('Rural payments organisation not found')
    },
    alsoMissing: () => {
      throw new NotFound('Customer not found')
    },
    broken: () => {
      throw new Error('something unexpected')
    },
    echo: () => 'fine'
  }
}

const run = async (query, variables) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [errorCodesPlugin()],
    formatError
  })
  const request = {}
  await server.executeOperation({ query, variables }, { contextValue: { request } })
  return request
}

describe('errorCodesPlugin', () => {
  test('records nothing on the request when the query succeeds', async () => {
    // arrange / act
    const request = await run('{ ok }')

    // assert
    expect(request).not.toHaveProperty('graphqlErrorCodes')
  })

  test('records the code of an error thrown by a resolver', async () => {
    // arrange / act
    const request = await run('{ missing }')

    // assert
    expect(request.graphqlErrorCodes).toEqual(['NOT FOUND'])
  })

  test('records each different code once, when several fields fail', async () => {
    // arrange / act
    const request = await run('{ missing alsoMissing broken }')

    // assert
    expect(request.graphqlErrorCodes).toEqual(['NOT FOUND', 'INTERNAL_SERVER_ERROR'])
  })

  test('records the code of an error raised before any resolver runs', async () => {
    // arrange / act
    const request = await run('{ notAField }')

    // assert
    expect(request.graphqlErrorCodes).toEqual(['GRAPHQL_VALIDATION_FAILED'])
  })

  test('never records the error message, which can repeat a value the caller sent', async () => {
    // arrange / act
    const request = await run('query ($sbi: Int!) { echo(sbi: $sbi) }', { sbi: '107183280' })

    // assert
    expect(request.graphqlErrorCodes).toEqual(['BAD_USER_INPUT'])
    expect(JSON.stringify(request)).not.toContain('107183280')
  })

  test('does not throw when the request has no context (context creation failed)', async () => {
    // arrange
    const server = new ApolloServer({ typeDefs, resolvers, plugins: [errorCodesPlugin()] })

    // act
    const response = await server.executeOperation({ query: '{ missing }' })

    // assert
    expect(response.body.singleResult.errors).toHaveLength(1)
  })
})
