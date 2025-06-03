import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { buildSchema, findBreakingChanges, getIntrospectionQuery, graphql } from 'graphql'
import { config } from '../../app/config.js'

describe('schema', () => {
  beforeEach(() => {
    config.set('allSchemaOn', true)
  })

  it('should not include custom directive in final schema output', async () => {
    const { schema } = await import(`../../app/graphql/server.js?test=${Math.random()}`)
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    expect(result.data.__schema.directives.find(({ name }) => name === 'on')).toBe(undefined)
  })

  it('should only contain fields that have the directive', async () => {
    config.set('allSchemaOn', null)
    const { schema } = await import(`../../app/graphql/server.js?test=${Math.random()}`)

    expect(
      findBreakingChanges(
        schema,
        buildSchema(
          await readFile(
            join(dirname(fileURLToPath(import.meta.url)), 'partial-schema.gql'),
            'utf-8'
          )
        )
      )
    ).toHaveLength(0)
  })

  it('should contain all fields if process.env.ALL_SCHEMA is set', async () => {
    const { schema } = await import(`../../app/graphql/server.js?test=${Math.random()}`)
    expect(
      findBreakingChanges(
        schema,
        buildSchema(
          await readFile(join(dirname(fileURLToPath(import.meta.url)), 'full-schema.gql'), 'utf-8')
        )
      )
    ).toHaveLength(0)
  })
})
