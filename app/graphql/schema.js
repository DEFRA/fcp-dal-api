import { loadFiles } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { filterSchema, pruneSchema } from '@graphql-tools/utils'
import { IBANTypeDefinition } from 'graphql-scalars'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { authDirectiveTransformer } from '../auth/authenticate.js'
import { config } from '../config.js'
import { excludeFromListTransformer } from './directives/excludeFromListTransformer.js'
import { externalToServiceAccountDirectiveTransformer } from './directives/externalToServiceAccount.js'
import { onDirectiveTransformer } from './directives/onDirectiveTransformer.js'

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

export async function createSchema() {
  let schema = makeExecutableSchema({
    typeDefs: [...(await getFiles('types')), IBANTypeDefinition],
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

  if (!config.get('allSchemaOn')) {
    schema = onDirectiveTransformer(schema)
  }
  if (!config.get('auth.disabled')) {
    schema = authDirectiveTransformer(schema)
  } else if (config.get('cdp.env') !== 'dev') {
    throw new Error(
      'Cannot disable auth outside of dev environment',
      `DISABLE_AUTH:${config.get('auth.disabled')} ENVIRONMENT:${config.get('cdp.env')}`
    )
  }

  schema = externalToServiceAccountDirectiveTransformer(schema)

  schema = excludeFromListTransformer(schema)

  schema = filterSchema({
    schema,
    directiveFilter: (name) =>
      ['include', 'skip', 'deprecated', 'specifiedBy', 'oneOf'].includes(name)
  })

  schema = pruneSchema(schema)

  return schema
}
