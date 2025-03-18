import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { getNamedType, GraphQLList, GraphQLObjectType } from 'graphql'

export function excludeFromListTransformer(schema) {
  const schemaWithPartialTypes = mapSchema(schema, {
    [MapperKind.OBJECT_TYPE](objectConfig) {
      const type = objectConfig.toConfig()
      const excludedFields = []

      Object.keys(type.fields).forEach((key) => {
        if (getDirective(schema, type.fields[key], 'excludeFromList')) {
          excludedFields.push(key)
          delete type.fields[key]
        }
      })

      if (excludedFields.length) {
        type.name = `${objectConfig.name}Partial`
        type.description = `${type.description}\n\nPartial of type \`${objectConfig.name}\` with excluded fields: ${excludedFields.join(', ')}`
        return new GraphQLObjectType(type)
      }

      return objectConfig
    }
  })

  return mapSchema(schema, {
    [MapperKind.FIELD](fieldConfig) {
      if (fieldConfig.type instanceof GraphQLList) {
        const type = getNamedType(fieldConfig.type)
        const summaryType = schemaWithPartialTypes.getType(`${type.name}Partial`)

        if (summaryType) {
          fieldConfig.type = new GraphQLList(summaryType)
        }
      }
      return fieldConfig
    }
  })
}
