/**
 * Walks a GraphQL query path back up to it's root node.  For example, for the query
 *
 * ```
 * Query {
 *   business: {
 *     info: {
 *       name
 *     }
 *   }
 * }
 * ```
 * this function will walk from anywhere in the path `business.info.name` back to `business`
 * @param {import('graphql').GraphQLResolveInfo} info the info argument provided to all resolvers
 * @returns {undefined|string} the root node for the given path
 */
export function rootKeyFromInfoPath(info) {
  let segment = info?.path
  if (!segment) {
    return undefined
  }
  while (segment.prev) {
    segment = segment.prev
  }
  return segment.key
}

/**
 * Per-request store for entities/accounts discovered at resolve time (e.g. an FRN looked up
 * from an upstream call). One instance lives on
 * contextValue for the lifetime of a single request
 */
export function createAuditTrail(authContext) {
  const byRoot = new Map()
  let serviceAccount = authContext?.serviceAccount

  const bucket = (rootKey) => {
    if (!byRoot.has(rootKey)) {
      byRoot.set(rootKey, { entities: [], accounts: {} })
    }
    return byRoot.get(rootKey)
  }

  return {
    /**
     * Records an entity that has been accessed in this request
     *
     * @param {import('graphql').GraphQLResolveInfo} info the info argument provided to all resolvers
     * @param {string} entity the name of the entity, e.g. 'payment-list'
     * @param {string} action the operation carried out, e.g. 'read'
     * @param {string} entityid the unique identifier for the entity operation, e.g. SBI, CRN, FRN etc
     */
    recordEntity(info, { entity, action, entityid }) {
      const rootKey = rootKeyFromInfoPath(info)
      if (!rootKey) {
        return
      }
      bucket(rootKey).entities.push({ entity, action, entityid })
    },

    /**
     * Each audit entry can have one or more accounts associated with it, this will basically be
     * the super-set of the entity ids captured against individual entities
     * @param {import('graphql').GraphQLResolveInfo} info the info argument provided to all resolvers
     * @param {string} accountIdentifierName the name of the account identifier, e.g. SBI
     * @param {string} accountIdentifier the account identifier value
     */

    recordAccount(info, accountIdentifierName, accountIdentifier) {
      const rootKey = rootKeyFromInfoPath(info)
      if (!rootKey || accountIdentifier == null) {
        return
      }
      bucket(rootKey).accounts[accountIdentifierName] = String(accountIdentifier)
    },

    /**
     * Some requests may be serviced by a client supplied service account
     * @param {string} serviceAccountValue the value (email address) of the service account
     */
    recordServiceAccount(serviceAccountValue) {
      serviceAccount = serviceAccountValue
    },

    /**
     * Retrieves the identified entities and accounts after processing the Graph.  Can be used by the audit plugin to
     * build the audit payload
     * @param rootKey
     * @returns {{entities: [{entity: string, action: string, entityid: string}] | undefined, accounts: Record<string, string> | undefined}}
     */
    getForRoot(rootKey) {
      const found = byRoot.get(rootKey)
      return {
        entities: found?.entities.length ? found.entities : undefined,
        accounts: Object.keys(found?.accounts ?? {}).length ? found.accounts : undefined
      }
    },

    /**
     * Every root selection something has been recorded against. Lets the audit plugin build one event per root without
     * needing to re-parse the query document itself.
     * @returns {string[]}
     */
    rootKeys() {
      return Array.from(byRoot.keys())
    },

    serviceAccount() {
      return serviceAccount
    }
  }
}
