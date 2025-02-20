import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'

export function onDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.FIELD](fieldConfig) {
      return getDirective(schema, fieldConfig, 'on')?.[0] ? fieldConfig : null
    }
  })
}
