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
      const variablePath = directive.variable
      const { resolve = defaultFieldResolver } = fieldConfig

      fieldConfig.resolve = (source, args, context, info) => {
        const value = variablePath.split('.').reduce((obj, key) => obj[key], args)
        if (value !== undefined && !regex.test(value)) {
          throw new GraphQLError(
            `variable '${variablePath}' must match pattern ${directive.pattern}`,
            {
              extensions: { code: 'BAD_USER_INPUT' }
            }
          )
        }
        return resolve(source, args, context, info)
      }

      return fieldConfig
    }
  })
}

export const validateVariablesDirective = (schema, directiveName = 'validateVariables') => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
      if (!directive) {
        return fieldConfig
      }

      const variablesPaths = directive.variables // variable to check
      const { resolve = defaultFieldResolver } = fieldConfig

      if (
        !Array.isArray(variablesPaths) ||
        !Array.isArray(directive.patterns) ||
        variablesPaths.length !== directive.patterns.length
      ) {
        throw new Error(
          `The number of patterns must match the number of arguments in the @${directiveName} directive.`
        )
      }

      const regexes = directive.patterns.map((pattern) => new RegExp(pattern))
      fieldConfig.resolve = (source, args, context, info) => {
        regexes.forEach((regex, index) => {
          const value = variablesPaths[index].split('.').reduce((obj, key) => obj[key], args)

          if (value !== undefined && !regex.test(value)) {
            throw new GraphQLError(
              `variable '${variablesPaths[index]}' must match pattern: ${directive.patterns[index]}`,
              {
                extensions: { code: 'BAD_USER_INPUT' }
              }
            )
          }
        })

        return resolve(source, args, context, info)
      }

      return fieldConfig
    }
  })
}
