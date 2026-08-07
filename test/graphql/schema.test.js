import { beforeEach, jest } from '@jest/globals'

import {
  findBreakingChanges,
  findDangerousChanges,
  getIntrospectionQuery,
  graphql,
  isObjectType
} from 'graphql'
import { cdpEnvironments, config } from '../../app/config.js'
import { wipEnabledEnvironments } from '../../app/graphql/directives/wipDirectiveTransformer.js'
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
      expect.objectContaining({
        description:
          'Directs the executor to include this field or fragment only when the `if` argument is true.',
        name: 'include'
      }),
      expect.objectContaining({
        description:
          'Directs the executor to skip this field or fragment when the `if` argument is true.',
        name: 'skip'
      }),
      expect.objectContaining({
        description: 'Marks an element of a GraphQL schema as no longer supported.',
        name: 'deprecated'
      }),
      expect.objectContaining({
        description: 'Exposes a URL that specifies the behavior of this scalar.',
        name: 'specifiedBy'
      }),
      expect.objectContaining({
        description:
          'Indicates exactly one field must be supplied and this field must not be `null`.',
        name: 'oneOf'
      })
    ])
  })

  it('ensures all sensitive top-level fields have @auth directive', async () => {
    const schema = await createSchema()
    const unprotectedFields = getUnprotectedFields(schema)
    expect(unprotectedFields).toEqual(
      expect.arrayContaining(['Query.referenceData', 'Query.wipExample'])
    )
  })

  it('directives clean up schema as expected', async () => {
    mockEnv.mockReturnValue('prod')
    expect(config.get('cdp.env')).toBe('prod')

    // Schema with no directives applied
    const rawSchema = await createRawSchema()
    // Apply directives
    const schema = await createSchema()

    expect(findDangerousChanges(rawSchema, schema)).toHaveLength(0)
    let changes = findBreakingChanges(rawSchema, schema)
    expect(changes).toHaveLength(14) // WARNING: CAREFULLY CHECK ANY FAILURES!!! 🔥
    expect(changes).toEqual(
      // loose array check, so ordering isn't important, length MUST match, see above
      expect.arrayContaining([
        { type: 'TYPE_REMOVED', description: 'AuthGroup was removed.' },
        { type: 'TYPE_REMOVED', description: 'Numeric was removed.' },
        { type: 'TYPE_REMOVED', description: 'Image was removed.' },
        { type: 'TYPE_REMOVED', description: 'UUID was removed.' },
        {
          type: 'TYPE_REMOVED',
          description: 'PermittedFunction was removed.'
        },
        {
          type: 'FIELD_REMOVED',
          description: 'Query.wipExample was removed.'
        },
        {
          type: 'FIELD_REMOVED',
          description: 'Business.permittedFunctions was removed.'
        },
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
        },
        { type: 'DIRECTIVE_REMOVED', description: 'validateVariable was removed.' }
      ])
    )

    expect(findDangerousChanges(schema, rawSchema)).toHaveLength(0)
    changes = findBreakingChanges(schema, rawSchema)
    expect(changes).toHaveLength(6) // WARNING: CAREFULLY CHECK ANY FAILURES!!! 🔥
    expect(changes).toEqual(
      // loose array check, so ordering isn't important, length MUST match, see above
      expect.arrayContaining([
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
    )
  })

  describe('wip directive', () => {
    const testSchema = `#graphql
      extend type Query { wipTest: Boolean @wip, nested: Nested }
      type Nested { otherNestedField: Boolean, nestedWipTest: Boolean @wip }
    `

    it.each(
      cdpEnvironments.map((env) => [wipEnabledEnvironments.has(env) ? 'enabled' : 'disabled', env])
    )('wip fields are %s in %s', async (isWipEnabled, env) => {
      mockEnv.mockReturnValue(env)
      expect(config.get('cdp.env')).toBe(env)

      const schema = await createSchema(testSchema)
      const queryType = schema.getQueryType()
      const nestedType = schema.getType('Nested')

      if (isWipEnabled === 'enabled') {
        expect(queryType.getFields().wipTest).toBeDefined()
        expect(nestedType.getFields().nestedWipTest).toBeDefined()
      } else {
        expect(queryType.getFields().wipTest).toBeUndefined()
        expect(nestedType.getFields().nestedWipTest).toBeUndefined()
      }
    })

    it.each([...wipEnabledEnvironments])(
      'wip fields have a deprecation reason in %s',
      async (env) => {
        mockEnv.mockReturnValue(env)

        const schema = await createSchema(testSchema)

        const queryType = schema.getQueryType()
        const nestedType = schema.getType('Nested')

        expect(queryType.getFields().wipTest.deprecationReason).toBe(
          'Work in progress — may change or be removed'
        )
        expect(nestedType.getFields().nestedWipTest.deprecationReason).toBe(
          'Work in progress — may change or be removed'
        )
      }
    )
  })
})
