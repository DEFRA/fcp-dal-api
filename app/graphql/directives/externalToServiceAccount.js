import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { defaultFieldResolver } from 'graphql'

/**
 * Wraps the resolver of any field tagged `@externalToServiceAccount` so that, when the
 * field is resolved for an external request, it uses the DAL service account to access the
 * internal route instead.
 *
 * Internal requests and requests with no directive are unaffected.
 *
 * @param {import('graphql').GraphQLSchema} schema - the schema to transform.
 * @returns {import('graphql').GraphQLSchema} the schema with tagged field resolvers wrapped.
 */
export function externalToServiceAccountDirectiveTransformer(schema) {
  const directiveName = 'externalToServiceAccount'

  /**
   * Returns either the first directive matching directiveName (a node can carry repeatable directives) or
   * undefined if absent
   */
  function getFirstDirective(schema, node, directiveName) {
    return getDirective(schema, node, directiveName)?.[0]
  }

  function getServiceAccountDataSource(context, typeName, fieldName) {
    const serviceAccountRuralPaymentsBusiness =
      context.dataSources?.serviceAccount?.ruralPaymentsBusiness

    if (!serviceAccountRuralPaymentsBusiness) {
      throw new Error(
        `@externalToServiceAccount misconfigured: context.dataSources.serviceAccount.ruralPaymentsBusiness is missing (resolving ${typeName}.${fieldName})`
      )
    }

    return serviceAccountRuralPaymentsBusiness
  }

  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD](fieldConfig, fieldName, typeName) {
      const directive = getFirstDirective(schema, fieldConfig, directiveName)
      const { resolve = defaultFieldResolver } = fieldConfig

      if (directive) {
        // The field has been annotated with the externalToServiceAccount annotation, so
        // need to ensure the correct data source is used

        fieldConfig.resolve = function (source, args, context, info) {
          // Internal gateway requests should be unaffected by this directive, resolve the field
          // using the default datasource
          if (context.gatewayType !== 'external') {
            return resolve(source, args, context, info)
          }

          // Swap the service account datasource into the context.  Implement as a shallow-copy
          // so the swap is local to this resolver call and doesn't leak into sibling
          // fields resolving concurrently off the same shared context.
          const swappedContext = {
            ...context,
            dataSources: {
              ...context.dataSources,
              ruralPaymentsBusiness: getServiceAccountDataSource(context, typeName, fieldName)
            }
          }

          return resolve(source, args, swappedContext, info)
        }
      }

      return fieldConfig
    }
  })
}
