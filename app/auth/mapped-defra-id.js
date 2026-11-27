// In the dev and test environments it is possible to call the DAL with an unverified Defra
// ID-shaped token. Only tokens whose CRN is in the DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING secret are
// accepted this way; any other token is verified as normal.
//
// - mappedDefraIdHapiPlugin turns a request carrying a mapped token into a DAL service-account
//   request before anything else sees it, and marks it as mapped by setting
//   `request.app.mappedDefraId` ({ dummyCrn, sbis }). The token is never verified or sent
//   upstream, and the rest of the DAL treats the request like any other service-account request.
// - mappedDefraIdApolloPlugin then restricts what a mapped request can do: queries only, allowed
//   root fields only, and only the mapped SBIs.
//
// Both plugins are only registered when a mapping is configured, and config refuses to start with
// a mapping outside dev/test, so none of this can run in production.
import { getArgumentValues, getVariableValues, OperationTypeNode } from 'graphql'
import { decodeJwt } from 'jose'
import { config, dummyCrnToSbiMapping } from '../config.js'
import { BadRequest, Forbidden } from '../errors/graphql.js'
import { fragmentsByName, rootFieldNodes } from '../graphql/operation-fields.js'
import { DAL_REQUEST_AUTHENTICATION_DEFRA_ID_MAPPED_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { maskAllButLastFour } from '../logger/utils.js'

// Root fields a mapped request may select. Anything not listed, including fields added to the
// schema later, is refused
export const MAPPED_ALLOWED_ROOT_FIELDS = new Set(['business', '__typename'])

export const MAPPED_QUERIES_ONLY_MESSAGE = 'Only queries are available for a mapped Defra ID token'
export const MAPPED_SBI_MESSAGE = 'Defra ID token is not valid for the provided SBI'

/**
 * If the request carries a Defra ID token whose CRN is in the dummy CRN to SBI mapping, rewrites it
 * as a DAL service-account request and records the mapping on `request.app.mappedDefraId`.
 * Any other request is left untouched.
 */
export function mapDefraIdRequest(request) {
  const { headers } = request
  const token = headers['x-forwarded-authorization']
  if (!token || headers.email || headers['service-account']) {
    // Not a Defra ID only request, so there is nothing to map; normal authentication handles it
    return
  }

  let payload
  try {
    payload = decodeJwt(token)
  } catch {
    // not a JWT, so it can't be mapped; let normal verification report the error
    return
  }

  const dummyCrn = `${payload.contactId}`
  const sbis = dummyCrnToSbiMapping.get(dummyCrn)
  if (!sbis) {
    // There is no matching CRN in the mapping; let normal verification handle the token
    return
  }

  delete headers['x-forwarded-authorization']
  headers['service-account'] = config.get('kits.dalServiceAccountEmail')
  request.app.mappedDefraId = { dummyCrn, sbis }

  logger.warn('#DAL Request authentication - dummy Defra ID CRN mapped to SBIs', {
    type: 'http',
    code: DAL_REQUEST_AUTHENTICATION_DEFRA_ID_MAPPED_001,
    traceId: request.traceId,
    tenant: {
      message: JSON.stringify({
        contactId: maskAllButLastFour(dummyCrn),
        sbis: [...sbis].map(maskAllButLastFour)
      })
    }
  })
}

export const mappedDefraIdHapiPlugin = {
  name: 'mapped-defra-id',
  register(server) {
    server.ext('onRequest', (request, h) => {
      mapDefraIdRequest(request)
      return h.continue
    })
  }
}

/**
 * Checks that an operation is allowed for a mapped Defra ID token.
 *
 * @throws {Forbidden} for a mutation (or subscription) or a root field that is not allowed
 * @throws {BadRequest} for a `business` whose SBI is not mapped to the dummy CRN
 */
export function assertMappedOperationAllowed({ schema, document, operation, variables, sbis }) {
  // `operation` is the operation being run (the document may hold several; Apollo has already
  // picked one by operationName). Its type is query, mutation or subscription
  if (operation.operation !== OperationTypeNode.QUERY) {
    throw new Forbidden(MAPPED_QUERIES_ONLY_MESSAGE)
  }

  // Besides operations, the parsed document holds any named fragments, needed to follow spreads
  const fragments = fragmentsByName(document)

  // The variables arrive as raw JSON from the request. Coerce them to their declared types (as
  // GraphQL execution would), so e.g. an ID given as the number 810000000 becomes "810000000"
  const { coerced, errors } = getVariableValues(
    schema,
    operation.variableDefinitions ?? [],
    variables ?? {}
  )
  if (errors) {
    throw errors[0]
  }

  // The schema's definitions of the root Query fields, used to read each field's arguments
  const queryFields = schema.getQueryType().getFields()
  for (const fieldNode of rootFieldNodes(operation.selectionSet, fragments)) {
    // The field's schema name. An alias (`a: business(...)`) only changes the response key, so
    // it is ignored here
    const name = fieldNode.name.value
    if (!MAPPED_ALLOWED_ROOT_FIELDS.has(name)) {
      throw new Forbidden(`${name} is not available for a mapped Defra ID token`)
    }
    if (name === 'business') {
      // Resolve the field's arguments the same way GraphQL execution does: a literal
      // (`sbi: "810000000"`) or a variable (`sbi: $sbi`) both give the final string value
      const { sbi } = getArgumentValues(queryFields.business, fieldNode, coerced)
      if (!sbis.has(sbi)) {
        throw new BadRequest(MAPPED_SBI_MESSAGE)
      }
    }
  }
}

export function mappedDefraIdApolloPlugin() {
  return {
    async requestDidStart() {
      return {
        // Apollo calls this once the query has been parsed and validated and the operation to run
        // is known, but before any resolver runs. Throwing here fails the whole request
        async didResolveOperation({ schema, document, operation, request, contextValue }) {
          // contextValue.request is the hapi request (see app/graphql/context.js)
          const mappedDefraId = contextValue?.request?.app?.mappedDefraId
          if (!mappedDefraId) {
            return
          }
          assertMappedOperationAllowed({
            schema,
            document,
            operation,
            variables: request.variables,
            sbis: mappedDefraId.sbis
          })
        }
      }
    }
  }
}
