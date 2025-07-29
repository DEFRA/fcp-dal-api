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

const path = join(dirname(fileURLToPath(import.meta.url)))

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

  it('should not include custom directives in final schema output', async () => {
    const schema = await createSchema()
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    console.log(result.data.__schema.directives)
    expect(result.data.__schema.directives).toEqual([
      {
        args: [
          {
            defaultValue: null,
            description: 'Included when true.',
            name: 'if',
            type: {
              kind: 'NON_NULL',
              name: null,
              ofType: { kind: 'SCALAR', name: 'Boolean', ofType: null }
            }
          }
        ],
        description:
          'Directs the executor to include this field or fragment only when the `if` argument is true.',
        locations: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
        name: 'include'
      },
      {
        args: [
          {
            defaultValue: null,
            description: 'Skipped when true.',
            name: 'if',
            type: {
              kind: 'NON_NULL',
              name: null,
              ofType: { kind: 'SCALAR', name: 'Boolean', ofType: null }
            }
          }
        ],
        description:
          'Directs the executor to skip this field or fragment when the `if` argument is true.',
        locations: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
        name: 'skip'
      },
      {
        args: [
          {
            defaultValue: '"No longer supported"',
            description:
              'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).',
            name: 'reason',
            type: { kind: 'SCALAR', name: 'String', ofType: null }
          }
        ],
        description: 'Marks an element of a GraphQL schema as no longer supported.',
        locations: [
          'FIELD_DEFINITION',
          'ARGUMENT_DEFINITION',
          'INPUT_FIELD_DEFINITION',
          'ENUM_VALUE'
        ],
        name: 'deprecated'
      },
      {
        args: [
          {
            defaultValue: null,
            description: 'The URL that specifies the behavior of this scalar.',
            name: 'url',
            type: {
              kind: 'NON_NULL',
              name: null,
              ofType: { kind: 'SCALAR', name: 'String', ofType: null }
            }
          }
        ],
        description: 'Exposes a URL that specifies the behavior of this scalar.',
        locations: ['SCALAR'],
        name: 'specifiedBy'
      },
      {
        args: [],
        description:
          'Indicates exactly one field must be supplied and this field must not be `null`.',
        locations: ['INPUT_OBJECT'],
        name: 'oneOf'
      }
    ])
  })

  it('should contain all fields if process.env.ALL_SCHEMA is set', async () => {
    const schema = await createSchema()
    const fullSchema = buildSchema(await readFile(join(path, 'full-schema.gql'), 'utf-8'))

    expect(findDangerousChanges(fullSchema, schema)).toHaveLength(0)
    expect(findBreakingChanges(fullSchema, schema)).toHaveLength(0)
    expect(findDangerousChanges(schema, fullSchema)).toHaveLength(0)
    expect(findBreakingChanges(schema, fullSchema)).toHaveLength(0)
  })

  it('should only contain fields that have the directive', async () => {
    config.set('allSchemaOn', null)
    const schema = await createSchema()

    const partialSchema = buildSchema(await readFile(join(path, 'partial-schema.gql'), 'utf-8'))

    expect(findDangerousChanges(partialSchema, schema)).toHaveLength(0)
    expect(findBreakingChanges(partialSchema, schema)).toHaveLength(0)
    expect(findDangerousChanges(schema, partialSchema)).toHaveLength(0)
    expect(findBreakingChanges(schema, partialSchema)).toHaveLength(0)
  })

  it('ensures all top-level fields have @auth directive', async () => {
    const schema = await createSchema()
    const unprotectedFields = getUnprotectedFields(schema)
    expect(unprotectedFields).toEqual([])
  })
})
