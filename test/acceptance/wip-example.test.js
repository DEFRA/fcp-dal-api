import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

// `wipExample` is marked @wip, so it is only exposed (as deprecated) in WIP-enabled environments
// (`dev` and `perf-test`, see app/graphql/directives/wipDirectiveTransformer.js). The acceptance
// stack runs with ENVIRONMENT=dev, so the field should be present here.
describe('wipExample Query', () => {
  const client = new GraphQLClient(targetURL)

  it('should be queryable without auth and return null, as it has no resolver', async () => {
    const response = await client.request(gql`
      query WipExample {
        wipExample
      }
    `)

    expect(response).toEqual({ wipExample: null })
  })

  it('should be marked as deprecated with the WIP reason', async () => {
    // NOTE: use __schema rather than __type(name: "Query"); graphql-inspector coverage
    // (test:acceptance:coverage) skips __schema but crashes on __type
    const response = await client.request(gql`
      query WipExampleIntrospection {
        __schema {
          queryType {
            fields(includeDeprecated: true) {
              name
              isDeprecated
              deprecationReason
            }
          }
        }
      }
    `)

    expect(response.__schema.queryType.fields).toContainEqual({
      name: 'wipExample',
      isDeprecated: true,
      deprecationReason: 'Work in progress — may change or be removed'
    })
  })
})
