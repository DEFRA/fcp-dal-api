import { beforeEach, jest } from '@jest/globals'

import {
  findBreakingChanges,
  findDangerousChanges,
  getIntrospectionQuery,
  graphql,
  isObjectType
} from 'graphql'
import { config } from '../../app/config.js'
import { createRawSchema, createSchema } from '../../app/graphql/schema.js'

function isFieldProtected(field) {
  const astNode = field.astNode
  if (!astNode?.directives) return false

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

const mockEnv = jest.fn()

const originalConfig = { ...config }

describe('schema', () => {
  beforeEach(() => {
    mockEnv.mockReturnValue('dev')

    jest.spyOn(config, 'get').mockImplementation((path) => {
      if (path === 'cdp.env') {
        return mockEnv()
      }

      if (path === 'auth.disabled') {
        return false
      }

      return originalConfig.get(path)
    })
  })

  it('should not include custom directives in final schema output', async () => {
    const schema = await createSchema()
    const result = await graphql({ schema, source: getIntrospectionQuery() })
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

  it('ensures all sensitive top-level fields have @auth directive', async () => {
    const schema = await createSchema()
    const unprotectedFields = getUnprotectedFields(schema)
    expect(unprotectedFields).toEqual(['Query.referenceData'])
  })

  it('directives clean up schema as expected', async () => {
    // Schema with no directives applied
    const rawSchema = await createRawSchema()
    // Apply directives
    const schema = await createSchema()

    expect(findDangerousChanges(rawSchema, schema)).toHaveLength(0)
    expect(findBreakingChanges(rawSchema, schema)).toEqual([
      { type: 'TYPE_REMOVED', description: 'AuthGroup was removed.' },
      { type: 'TYPE_REMOVED', description: 'Numeric was removed.' },
      { type: 'TYPE_REMOVED', description: 'Image was removed.' },
      { type: 'TYPE_REMOVED', description: 'UUID was removed.' },
      {
        type: 'FIELD_CHANGED_KIND',
        description:
          'Business.customers changed type from [BusinessCustomer] to [BusinessCustomerPartial].'
      },
      {
        type: 'FIELD_CHANGED_KIND',
        description:
          'BusinessLand.parcels changed type from [BusinessLandParcel] to [BusinessLandParcelPartial].'
      },
      {
        type: 'FIELD_CHANGED_KIND',
        description:
          'Customer.businesses changed type from [CustomerBusiness] to [CustomerBusinessPartial].'
      },
      { type: 'DIRECTIVE_REMOVED', description: 'wip was removed.' },
      { type: 'DIRECTIVE_REMOVED', description: 'auth was removed.' },
      {
        type: 'DIRECTIVE_REMOVED',
        description: 'excludeFromList was removed.'
      }
    ])

    expect(findDangerousChanges(schema, rawSchema)).toHaveLength(0)
    expect(findBreakingChanges(schema, rawSchema)).toEqual([
      { description: 'BusinessCustomerPartial was removed.', type: 'TYPE_REMOVED' },
      { description: 'BusinessLandParcelPartial was removed.', type: 'TYPE_REMOVED' },
      { description: 'CustomerBusinessPartial was removed.', type: 'TYPE_REMOVED' },
      {
        description:
          'Business.customers changed type from [BusinessCustomerPartial] to [BusinessCustomer].',
        type: 'FIELD_CHANGED_KIND'
      },
      {
        description:
          'BusinessLand.parcels changed type from [BusinessLandParcelPartial] to [BusinessLandParcel].',
        type: 'FIELD_CHANGED_KIND'
      },
      {
        description:
          'Customer.businesses changed type from [CustomerBusinessPartial] to [CustomerBusiness].',
        type: 'FIELD_CHANGED_KIND'
      }
    ])
  })

  it('wip fields should be removed from schema in prod', async () => {
    mockEnv.mockReturnValue('prod')

    const rawSchema = await createRawSchema(`#graphql
      extend type Query { wipTest: Boolean @wip, nested: Nested }
      type Nested { otherNestedField: Boolean, nestedWipTest: Boolean @wip }
    `)
    const schema = await createSchema()

    expect(config.get('cdp.env')).toBe('prod')
    expect(findBreakingChanges(rawSchema, schema)).toEqual(
      expect.arrayContaining([
        { type: 'FIELD_REMOVED', description: 'Query.wipTest was removed.' },
        { type: 'FIELD_REMOVED', description: 'Query.nested was removed.' }
      ])
    )
  })

  it('wip fields should NOT be removed from schema in dev', async () => {
    const testSchema = `#graphql
      extend type Query { wipTest: Boolean @wip, nested: Nested }
      type Nested { otherNestedField: Boolean, nestedWipTest: Boolean @wip }
    `

    const rawSchema = await createRawSchema(testSchema)
    const schema = await createSchema(testSchema)

    expect(config.get('cdp.env')).toBe('dev')

    expect(findBreakingChanges(rawSchema, schema)).toEqual(
      expect.not.arrayContaining([
        { type: 'FIELD_REMOVED', description: 'Query.wipTest was removed.' },
        { type: 'FIELD_REMOVED', description: 'Query.nested was removed.' }
      ])
    )
  })
})
