import { ApolloServer } from '@apollo/server'
import { describe, expect, test } from 'vitest'
import { NotFound } from '../../../../app/errors/graphql.js'
import { formatError } from '../../../../app/graphql/formatError.js'
import { accessLogPlugin } from '../../../../app/graphql/plugins/access-log.js'

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
    plugins: [accessLogPlugin()],
    formatError
  })
  const request = {}
  await server.executeOperation({ query, variables }, { contextValue: { request } })
  return request
}

describe('accessLogPlugin', () => {
  test('records no error codes on the request when the query succeeds', async () => {
    // arrange / act
    const request = await run('{ ok }')

    // assert
    expect(request).not.toHaveProperty('graphqlErrorCodes')
  })

  test('records the type and name of a named query', async () => {
    // arrange / act
    const request = await run('query GetOk { ok }')

    // assert
    expect(request.graphqlOperation).toEqual({ type: 'query', name: 'GetOk' })
  })

  test('records the type of a mutation', async () => {
    // arrange
    const server = new ApolloServer({
      typeDefs: `${typeDefs} type Mutation { doIt: String }`,
      resolvers: { ...resolvers, Mutation: { doIt: () => 'done' } },
      plugins: [accessLogPlugin()]
    })
    const request = {}

    // act
    await server.executeOperation(
      { query: 'mutation DoIt { doIt }' },
      { contextValue: { request } }
    )

    // assert
    expect(request.graphqlOperation).toEqual({ type: 'mutation', name: 'DoIt' })
  })

  test('records the type without a name for an anonymous operation', async () => {
    // arrange / act
    const request = await run('{ ok }')

    // assert
    expect(request.graphqlOperation).toEqual({ type: 'query', name: undefined })
  })

  test('picks the operation named by operationName when the document has several', async () => {
    // arrange
    const server = new ApolloServer({ typeDefs, resolvers, plugins: [accessLogPlugin()] })
    const request = {}

    // act
    await server.executeOperation(
      { query: 'query First { ok } query Second { ok }', operationName: 'Second' },
      { contextValue: { request } }
    )

    // assert
    expect(request.graphqlOperation).toEqual({ type: 'query', name: 'Second' })
  })

  test('records both the operation and the error codes when a resolver fails', async () => {
    // arrange / act
    const request = await run('query GetMissing { missing }')

    // assert
    expect(request.graphqlOperation).toEqual({ type: 'query', name: 'GetMissing' })
    expect(request.graphqlErrorCodes).toEqual(['NOT FOUND'])
  })

  test('records no operation when the query fails to parse', async () => {
    // arrange / act
    const request = await run('{ ok ')

    // assert
    expect(request).not.toHaveProperty('graphqlOperation')
    expect(request.graphqlErrorCodes).toEqual(['GRAPHQL_PARSE_FAILED'])
  })

  test('records no operation when the query fails validation', async () => {
    // arrange / act
    const request = await run('{ notAField }')

    // assert
    expect(request).not.toHaveProperty('graphqlOperation')
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
    const request = await run('query ($sbi: Int!) { echo(sbi: $sbi) }', { sbi: '812345678' })

    // assert
    expect(request.graphqlErrorCodes).toEqual(['BAD_USER_INPUT'])
    expect(JSON.stringify(request)).not.toContain('812345678')
  })

  test('does not throw when the request has no context (context creation failed)', async () => {
    // arrange
    const server = new ApolloServer({ typeDefs, resolvers, plugins: [accessLogPlugin()] })

    // act
    const response = await server.executeOperation({ query: '{ missing }' })

    // assert
    expect(response.body.singleResult.errors).toHaveLength(1)
  })
})
