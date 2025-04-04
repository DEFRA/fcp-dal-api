import { loadFiles } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { filterSchema, pruneSchema } from '@graphql-tools/utils'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { authDirectiveTransformer } from '../auth/authenticate.js'
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

  if (!process.env.ALL_SCHEMA_ON) {
    schema = onDirectiveTransformer(schema)
  }

  if (process.env.DISABLE_AUTH !== 'true') {
    schema = authDirectiveTransformer(schema)
  } else if (process.env.ENVIRONMENT !== 'dev') {
    throw new Error(
      'Cannot disable auth outside of dev envirnment',
      `DISABLE_AUTH:${process.env.DISABLE_AUTH} ENVIRONMENT:${process.env.ENVIRONMENT}`
    )
  }

  schema = excludeFromListTransformer(schema)

  schema = filterSchema({ schema, directiveFilter: () => false })

  schema = pruneSchema(schema)

  return schema
}
