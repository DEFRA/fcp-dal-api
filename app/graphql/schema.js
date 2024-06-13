import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

import { loadFiles } from '@graphql-tools/load-files'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeResolvers } from '@graphql-tools/merge'
import {
  MapperKind,
  filterSchema,
  getDirective,
  mapSchema,
  pruneSchema
} from '@graphql-tools/utils'

async function getFiles (path) {
  return loadFiles(join(dirname(fileURLToPath(import.meta.url)), path), {
    recursive: true,
    requireMethod: async (filePath) => import(pathToFileURL(filePath))
  })
}

export async function createSchema () {
  let schema = makeExecutableSchema({
    typeDefs: await getFiles('types'),
    resolvers: mergeResolvers(await getFiles('resolvers'))
  })

  if (!process.env.ALL_SCHEMA_ON) {
    schema = mapSchema(schema, {
      [MapperKind.FIELD] (fieldConfig) {
        return getDirective(schema, fieldConfig, 'on')?.[0]
          ? fieldConfig
          : null
      }
    })
  }

  schema = pruneSchema(schema)

  schema = filterSchema({
    schema,
    directiveFilter (directiveName) {
      return directiveName !== 'on'
    }
  })

  return schema
}
