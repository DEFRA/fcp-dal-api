import { getIntrospectionQuery } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { describe, expect, it } from 'vitest'
const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

describe('introspection query', () => {
  it('succeeds with no email, service-account or x-forwarded-authorization headers set', async () => {
    const client = new GraphQLClient(targetURL)

    const response = await client.request(getIntrospectionQuery())

    expect(response).not.toHaveProperty('errors')
    expect(response.__schema.queryType.name).toBe('Query')
    expect(response.__schema.types).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Business' })])
    )
  })
})
