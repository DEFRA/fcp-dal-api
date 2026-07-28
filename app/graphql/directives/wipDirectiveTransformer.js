import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { config } from '../../config.js'

const isWipEnabledEnvironments = ['dev', 'perf-test']

export function wipDirectiveTransformer(schema) {
  // WIP fields are only enabled in environments backed by the mock
  const isWipEnabled = isWipEnabledEnvironments.includes(config.get('cdp.env'))

  return mapSchema(schema, {
    [MapperKind.FIELD](fieldConfig) {
      if (getDirective(schema, fieldConfig, 'wip')) {
        if (!isWipEnabled) {
          // Remove WIP fields when not in a WIP-enabled environment
          return null
        }
        // Add deprecation reason when WIP is enabled
        return {
          ...fieldConfig,
          deprecationReason: 'Work in progress — may change or be removed'
        }
      }

      // Return non-WIP fields unaltered
      return fieldConfig
    },
    [MapperKind.INPUT_OBJECT_TYPE]: (type) => type,
    [MapperKind.INPUT_OBJECT_FIELD]: (inputFieldConfig) => inputFieldConfig
  })
}
