import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { isObjectType } from 'graphql'

function isVisibleToCaller(requires, callerGroups) {
  return callerGroups.includes('ADMIN') || requires.some((group) => callerGroups.includes(group))
}

/**
 * Removes fields from the schema that the given caller groups aren't allowed to see per @auth,
 * for use in a playground-only schema variant (the real @auth resolver wrapping from
 * authDirectiveTransformer still enforces access at execution time regardless).
 *
 * A type is never left with zero fields, since GraphQL requires object types to define at least
 * one - if every field on a type would be hidden, the last one is kept visible instead.
 */
export function restrictSchemaVisibility(schema, callerGroups) {
  if (callerGroups.includes('ADMIN')) {
    return schema
  }

  const typeAuthRequires = {}
  for (const type of Object.values(schema.getTypeMap())) {
    if (isObjectType(type)) {
      const typeDirective = getDirective(schema, type, 'auth')?.[0]
      if (typeDirective) {
        typeAuthRequires[type.name] = typeDirective.requires
      }
    }
  }

  const fieldsToHide = new Set()
  for (const type of Object.values(schema.getTypeMap())) {
    if (!isObjectType(type)) continue

    const fields = type.getFields()
    const fieldNames = Object.keys(fields)
    const hiddenFieldNames = fieldNames.filter((fieldName) => {
      const fieldDirective = getDirective(schema, fields[fieldName], 'auth')?.[0]
      const requires = fieldDirective?.requires ?? typeAuthRequires[type.name]
      return requires && !isVisibleToCaller(requires, callerGroups)
    })

    const keepLastFieldVisible = hiddenFieldNames.length === fieldNames.length
    const toHide = keepLastFieldVisible ? hiddenFieldNames.slice(0, -1) : hiddenFieldNames

    toHide.forEach((fieldName) => fieldsToHide.add(`${type.name}.${fieldName}`))
  }

  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD](fieldConfig, fieldName, typeName) {
      return fieldsToHide.has(`${typeName}.${fieldName}`) ? null : fieldConfig
    }
  })
}
