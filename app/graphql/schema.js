import { loadFiles } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { filterSchema, pruneSchema } from '@graphql-tools/utils'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { authDirectiveTransformer } from '../auth/authenticate.js'
import { config } from '../config.js'
import { excludeFromListTransformer } from './directives/excludeFromListTransformer.js'
import { onDirectiveTransformer } from './directives/onDirectiveTransformer.js'

async function getFiles(path) {
  return loadFiles(join(dirname(fileURLToPath(import.meta.url)), path), {
    recursive: true,
    requireMethod: async (filePath) => import(pathToFileURL(filePath))
  })
}

export async function createSchema() {
  let schema = makeExecutableSchema({
    typeDefs: await getFiles('types'),
    resolvers: mergeResolvers(await getFiles('resolvers'))
  })

  if (!config.get('allSchemaOn')) {
    schema = onDirectiveTransformer(schema)
  }
  if (!config.get('auth.disabled')) {
    schema = authDirectiveTransformer(schema)
  } else if (config.get('cdp.env') !== 'dev') {
    throw new Error(
      'Cannot disable auth outside of dev envirnment',
      `DISABLE_AUTH:${config.get('auth.disabled')} ENVIRONMENT:${config.get('cdp.env')}`
    )
  }

  schema = excludeFromListTransformer(schema)

  schema = filterSchema({ schema, directiveFilter: () => false })

  schema = pruneSchema(schema)

  return schema
}
