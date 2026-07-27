import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import {
  defaultFieldResolver,
  GraphQLError,
  isInputObjectType,
  isListType,
  isNonNullType
} from 'graphql'

const enhanceDescription = (schema, directiveName) => {
  return (argConfig) => {
    const directive = getDirective(schema, argConfig, directiveName)?.[0]
    if (!directive) {
      return argConfig
    }

    argConfig.description = `${
      argConfig.description ? argConfig.description + '\n\n' : ''
    }*Constraint:* must match pattern \`${directive.pattern}\``

    return argConfig
  }
}

const collectPatternsForArgument = (schema, argConfig, directiveName, argName = argConfig.name) => {
  const patterns = {}
  const directive = getDirective(schema, argConfig, directiveName)?.[0]
  if (directive) {
    patterns[argName] = new RegExp(directive.pattern)
  }

  const inputType = unwrapType(argConfig.type)
  if (isInputObjectType(inputType)) {
    collectInputObjectPatterns(schema, inputType, argName, directiveName, patterns)
  }

  return patterns
}

const collectInputObjectPatterns = (schema, inputType, prefix, directiveName, patterns) => {
  for (const [fieldName, fieldConfig] of Object.entries(inputType.getFields())) {
    const path = prefix ? `${prefix}.${fieldName}` : fieldName
    const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
    if (directive) {
      patterns[path] = new RegExp(directive.pattern)
    }

    const nestedType = unwrapType(fieldConfig.type)
    if (isInputObjectType(nestedType)) {
      collectInputObjectPatterns(schema, nestedType, path, directiveName, patterns)
    }
  }

  return patterns
}

const unwrapType = (type) => {
  while (isNonNullType(type) || isListType(type)) {
    type = type.ofType
  }
  return type
}

export const validateVariableDirective = (schema, directiveName = 'validateVariable') => {
  // Pass 1: annotate argument & input field descriptions
  schema = mapSchema(schema, {
    [MapperKind.ARGUMENT]: enhanceDescription(schema, directiveName),
    [MapperKind.INPUT_OBJECT_FIELD]: enhanceDescription(schema, directiveName)
  })

  // Pass 2: wrap resolvers to validate any arg carrying the directive
  schema = mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      if (!fieldConfig.args) {
        return fieldConfig
      }

      const patterns = Object.entries(fieldConfig.args).reduce((acc, [argName, argConfig]) => {
        Object.assign(acc, collectPatternsForArgument(schema, argConfig, directiveName, argName))
        return acc
      }, {})

      if (Object.keys(patterns).length === 0) {
        return fieldConfig
      }

      const { resolve = defaultFieldResolver } = fieldConfig
      fieldConfig.resolve = (source, args, context, info) => {
        for (const [variablePath, regex] of Object.entries(patterns)) {
          const value = variablePath
            .split('.') // needed for variables inside input objects
            .reduce((obj, key) => {
              if (obj === undefined || obj === null) {
                return undefined
              }
              return obj[key]
            }, args)

          if (value !== undefined && value !== null && !regex.test(String(value))) {
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
