import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { defaultFieldResolver, GraphQLError } from 'graphql'

export const validateVariableDirective = (schema, directiveName = 'validateVariable') => {
  // Pass 1: annotate argument descriptions
  schema = mapSchema(schema, {
    [MapperKind.ARGUMENT]: (argConfig) => {
      const directive = getDirective(schema, argConfig, directiveName)?.[0]
      if (!directive) {
        return argConfig
      }

      argConfig.description =
        (argConfig.description || '') +
        `\n*Constraint:* must match pattern \`${directive.pattern}\``
      return argConfig
    }
  })

  // Pass 2: wrap resolvers to validate any arg carrying the directive
  schema = mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      if (!fieldConfig.args) {
        return fieldConfig
      }

      const patterns = {}
      for (const [argName, argConfig] of Object.entries(fieldConfig.args)) {
        const directive = getDirective(schema, argConfig, directiveName)?.[0]
        if (directive) {
          patterns[argName] = new RegExp(directive.pattern)
        }
      }

      if (Object.keys(patterns).length === 0) {
        return fieldConfig
      }

      const { resolve = defaultFieldResolver } = fieldConfig
      fieldConfig.resolve = (source, args, context, info) => {
        for (const [variablePath, regex] of Object.entries(patterns)) {
          const value = variablePath.split('.').reduce((obj, key) => obj[key], args)
          if (value !== undefined && !regex.test(value)) {
            throw new GraphQLError(
              `variable '${variablePath}' must match pattern ${regex.source}`,
              {
                extensions: { code: 'BAD_USER_INPUT' }
              }
            )
          }
        }
        return resolve(source, args, context, info)
      }
      return fieldConfig
    }
  })

  return schema
}
