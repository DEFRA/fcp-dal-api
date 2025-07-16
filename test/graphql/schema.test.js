import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import {
  buildSchema,
  findBreakingChanges,
  findDangerousChanges,
  getIntrospectionQuery,
  graphql,
  isObjectType
} from 'graphql'
import { config } from '../../app/config.js'
import { createSchema } from '../../app/graphql/schema.js'

function isFieldProtected(field) {
  const astNode = field.astNode
  if (!astNode || !astNode.directives) return false

  return astNode.directives.some((d) => d.name.value === 'auth')
}

// Traverse top-level types
function getUnprotectedFields(schema) {
  const unprotected = []
  //  These are all the possible entrypoints for ApolloGQL
  const rootTypes = ['Query', 'Mutation', 'Subscription']

  for (const typeName of rootTypes) {
    const type = schema.getType(typeName)
    if (!type || !isObjectType(type)) continue

    const fields = type.getFields()

    for (const [fieldName, field] of Object.entries(fields)) {
      if (!isFieldProtected(field)) {
        unprotected.push(`${typeName}.${fieldName}`)
      }
    }
  }

  return unprotected
}

describe('schema', () => {
  beforeEach(() => {
    config.set('allSchemaOn', true)
  })

  it('should not include custom directive in final schema output', async () => {
    const schema = await createSchema()
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    expect(result.data.__schema.directives.find(({ name }) => name === 'on')).toBe(undefined)
  })

  it('should only contain fields that have the directive', async () => {
    config.set('allSchemaOn', null)
    const schema = await createSchema()

    const partialSchema = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), 'partial-schema.gql'),
      'utf-8'
    )
    expect(findDangerousChanges(schema, buildSchema(partialSchema))).toHaveLength(0)
    expect(findBreakingChanges(schema, buildSchema(partialSchema))).toHaveLength(0)
  })

  it('should contain all fields if process.env.ALL_SCHEMA is set', async () => {
    const schema = await createSchema()
    const fullSchema = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), 'full-schema.gql'),
      'utf-8'
    )
    expect(findDangerousChanges(schema, buildSchema(fullSchema))).toHaveLength(0)
    expect(findBreakingChanges(schema, buildSchema(fullSchema))).toHaveLength(0)
  })

  it('ensures all top-level fields have @auth directive', async () => {
    const schema = await createSchema()
    const unprotectedFields = getUnprotectedFields(schema)
    expect(unprotectedFields).toEqual([])
  })
})
