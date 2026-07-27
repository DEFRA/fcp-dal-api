import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { defaultFieldResolver, GraphQLError } from 'graphql'

export const validateVariableDirective = (schema, directiveName = 'validateVariable') => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
      if (!directive) {
        return fieldConfig
      }

      const regex = new RegExp(directive.pattern)
      const variableName = directive.variable // which variable to check, e.g. "id"
      const { resolve = defaultFieldResolver } = fieldConfig

      fieldConfig.resolve = (source, args, context, info) => {
        const value = args[variableName]
        if (value !== undefined && !regex.test(value)) {
          throw new GraphQLError(`${variableName} must match pattern ${directive.pattern}`, {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        return resolve(source, args, context, info)
      }
      return fieldConfig
    }
  })
}
