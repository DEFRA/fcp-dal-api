import { loadFiles } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { filterSchema, pruneSchema } from '@graphql-tools/utils'
import { IBANTypeDefinition } from 'graphql-scalars'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { authDirectiveTransformer } from '../auth/authenticate.js'
import { config } from '../config.js'
import { restrictSchemaVisibility } from './directives/authVisibilityFilter.js'
import { excludeFromListTransformer } from './directives/excludeFromListTransformer.js'
import { validateVariableDirective } from './directives/validateVariable.js'
import { wipDirectiveTransformer } from './directives/wipDirectiveTransformer.js'

import * as BusinessLand from './resolvers/business/business-land.js'
import * as Business from './resolvers/business/business.js'
import * as BusinessMutation from './resolvers/business/mutation.js'
import * as BusinessQuery from './resolvers/business/query.js'
import * as Customer from './resolvers/customer/customer.js'
import * as CustomerMutation from './resolvers/customer/mutation.js'
import * as CustomerQuery from './resolvers/customer/query.js'
import * as PermissionsQuery from './resolvers/permissions/query.js'
import * as ReferenceDataQuery from './resolvers/reference-data/query.js'
import * as Scalars from './resolvers/scalars.js'

async function getFiles(path) {
  return loadFiles(join(dirname(fileURLToPath(import.meta.url)), path), {
    recursive: true,
    requireMethod: async (filePath) => import(pathToFileURL(filePath))
  })
}

/**
 * Create a schema with no directive transformers applied
 */
export async function createRawSchema(...typeDefs) {
  return makeExecutableSchema({
    typeDefs: [...(await getFiles('types')), IBANTypeDefinition, ...typeDefs],
    resolvers: mergeResolvers([
      Business,
      BusinessLand,
      BusinessMutation,
      BusinessQuery,
      Customer,
      CustomerMutation,
      CustomerQuery,
      PermissionsQuery,
      ReferenceDataQuery,
      Scalars
    ])
  })
}

/**
 * Applies all directive transformers except the final directive-stripping/pruning steps, so
 * callers can still inspect directives (e.g. @auth) on the result before it's finalized.
 */
async function createAuthenticatedSchema(...typeDefs) {
  let schema = await createRawSchema(...typeDefs)

  schema = wipDirectiveTransformer(schema)
  schema = validateVariableDirective(schema) // Apply the validateVariable directive to the schema

  if (!config.get('auth.disabled')) {
    schema = authDirectiveTransformer(schema)
  } else if (config.get('cdp.env') !== 'dev') {
    throw new Error(
      'Cannot disable auth outside of dev environment',
      `DISABLE_AUTH:${config.get('auth.disabled')} ENVIRONMENT:${config.get('cdp.env')}`
    )
  }

  return excludeFromListTransformer(schema)
}

function finalizeSchema(schema) {
  schema = filterSchema({
    schema,
    directiveFilter: (name) =>
      ['include', 'skip', 'deprecated', 'specifiedBy', 'oneOf'].includes(name)
  })

  return pruneSchema(schema)
}

/**
 * Create a schema
 */
export async function createSchema(...typeDefs) {
  const schema = await createAuthenticatedSchema(...typeDefs)
  return finalizeSchema(schema)
}

/**
 * Create a schema with fields hidden that the given AuthGroup names aren't allowed to see per
 * @auth, for use in a playground-only schema variant. @auth access is still enforced as normal
 * at execution time - this only affects what's visible via introspection.
 */
export async function createSchemaForGroups(groups, ...typeDefs) {
  const schema = await createAuthenticatedSchema(...typeDefs)
  return finalizeSchema(restrictSchemaVisibility(schema, groups))
}
