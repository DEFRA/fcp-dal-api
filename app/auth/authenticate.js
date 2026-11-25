import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { Unit } from 'aws-embedded-metrics'
import { defaultFieldResolver } from 'graphql'
import { decodeProtectedHeader, jwtVerify } from 'jose'
import { authorisedEntities, config } from '../config.js'
import { Forbidden, Unauthorized } from '../errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { sendMetric } from '../logger/sendMetric.js'

const unauthedAppid = config.get('auth.disabled')
  ? 'auth-disabled-no-entityId'
  : 'no-entityId--no-auth-provided'
const unknownService = 'unknown-unauthorised-service'

const identifyService = (appid, groups) => {
  const entityFromAppId = authorisedEntities[appid]
  if (entityFromAppId) {
    return entityFromAppId
  }

  const entityMatchingGroup =
    Array.isArray(groups) &&
    groups.length &&
    Object.keys(authorisedEntities).find((allowedId) => groups.includes(allowedId))
  if (entityMatchingGroup) {
    return authorisedEntities[entityMatchingGroup]
  }

  return { entityId: 'no-entityId--no-approved-app-or-groups', serviceName: unknownService }
}

/**
 * Gets the authorised entity info from Authorization header contents in the `request` object.
 * Matches the `appid` (or `azp`), then `groups` claims from the JWT against the authorised
 * entities from the config (in that order, until the first matching ID) - otherwise the request
 * is considered unauthorised (and the `entityId` and `serviceName` are set accordingly).
 *
 * @param {*} request the incoming HTTP request
 * @param {*} jwkDatasource the JWKS keystore for verifying the JWT
 * @returns {Promise<{authenticated: boolean, entityId: string, authName?: string,
 *  serviceName: string}>}
 *  whether a token was supplied and verified (`authenticated`), the matching `entityId` from the
 *  token, `authName` for the `@auth` directive (only set for an authorised entity), and
 *  `serviceName` for the audit/metrics identifier
 */
export async function getAuthorisedEntity(request, jwkDatasource) {
  try {
    const token = request?.headers?.authorization?.split(' ')[1]
    if (!token) {
      return { authenticated: false, entityId: unauthedAppid, serviceName: unknownService }
    }

    const decodedToken = decodeProtectedHeader(token)
    const requestStart = Date.now()
    const signingKey = await jwkDatasource.getPublicKey(decodedToken.kid)
    const { payload: verified } = await jwtVerify(token, signingKey, { algorithms: ['RS256'] })
    const requestTimeMs = Date.now() - requestStart
    void sendMetric('RequestTime', requestTimeMs, Unit.Milliseconds, {
      code: DAL_REQUEST_AUTHENTICATION_001
    })

    logger.info('#DAL Request authentication - JWT verified', {
      type: 'http',
      code: DAL_REQUEST_AUTHENTICATION_001,
      traceId: request?.traceId,
      requestTimeMs,
      request: { remoteAddress: request?.info?.remoteAddress },
      tenant: {
        message: JSON.stringify({
          appid: verified.appid,
          aud: verified.aud,
          oid: verified.oid,
          sub: verified.sub,
          tid: verified.tid,
          groups: verified.groups,
          roles: verified.roles,
          azp: verified.azp,
          iat: verified.iat,
          exp: verified.exp,
          ver: verified.ver
        })
      }
    })

    return {
      authenticated: true,
      ...identifyService(verified.appid ?? verified.azp, verified.groups)
    }
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.code === 'ERR_JWT_EXPIRED' ||
      error.name === 'JWTExpired'
    ) {
      logger.warn('#DAL - request authentication - token expired', {
        error,
        code: DAL_REQUEST_AUTHENTICATION_001,
        traceId: request?.traceId,
        request: { remoteAddress: request?.info?.remoteAddress }
      })
    } else {
      logger.error('#DAL - request authentication - Error verifying jwt', {
        error,
        code: DAL_REQUEST_AUTHENTICATION_001,
        traceId: request?.traceId,
        request: { remoteAddress: request?.info?.remoteAddress }
      })
    }
    return {
      authenticated: false,
      entityId: 'no-entityId--token-verification-failed',
      serviceName: unknownService
    }
  }
}

/**
 * Blocks the request unless it contains a verified token for an authorised DAL consumer. Applied
 * when the request context is built, before the query is parsed, so no part of the schema (fields
 * without `@auth`, introspection, validation errors) is available to unauthorised callers.
 * Skipped when auth is disabled.
 *
 * @param {{authenticated: boolean, authName?: string}} auth the result of `getAuthorisedEntity`
 * @throws {Unauthorized} if no token was supplied, or it could not be verified
 * @throws {Forbidden} if the token is valid but does not identify an authorised entity
 */
export function requireAuthorisedEntity(auth) {
  if (config.get('auth.disabled')) {
    return
  }
  if (!auth?.authenticated) {
    throw new Unauthorized('Authorization failed, a valid authorization token is required')
  }
  if (!auth.authName) {
    throw new Forbidden('Authorization failed, requester is not an authorised DAL consumer')
  }
}

/**
 * Check if the caller is a service account.
 * @param authContext the auth context
 * @returns {boolean} true if the caller is a service account, false otherwise
 */
function isServiceAccount(authContext) {
  return !!authContext?.serviceAccount
}

/**
 * Mutations can't be called by service accounts, queries are permitted by service accounts and
 * non-service accounts.
 */
function isServiceAccountPermitted(schema, typeName) {
  const mutationTypeName = schema.getMutationType()?.name
  const isMutationField = typeName === mutationTypeName

  return !isMutationField
}

/**
 * Checks that the requester's authorised entity satisfies the given @auth allow-list.
 *
 * @param {string} authName the authorisation name from `getAuthorisedEntity`
 * @param {string[]} allowedServices the list of services that can access this data
 * @throws {Unauthorized} if access is not granted
 */
export function checkAuthEntity(authName, allowedServices) {
  if (['ADMIN', ...allowedServices].includes(authName)) {
    return
  }

  throw new Unauthorized(
    'Authorization failed, requester is not able to access this part of the schema'
  )
}

/**
 * A field guarded by @auth is usable by a service-account caller according to the following:
 * - if caller has ADMIN membership, always permitted
 * - if this is a mutation - service accounts are NOT permitted, but other consumer accounts are
 * - if this is a query - both service accounts and non-service accounts are permitted
 *
 * @throws {Unauthorized} if access is not granted
 */
export function checkServiceAccountAccess(serviceAccount, serviceAccountPermitted, adminCaller) {
  if (serviceAccount && !serviceAccountPermitted && !adminCaller) {
    throw new Unauthorized('Authorization failed, this field is not available to service accounts')
  }
}

/**
 * Derives the end user's access type from the request-level end-user auth context (see
 * `app/auth/end-user-auth-context.js`): an `email` header identifies an internal (Rural Payments
 * portal) user, an `x-forwarded-authorization` header identifies an external (Defra ID) user.
 *
 * @returns {'INTERNAL'|'EXTERNAL'|undefined}
 */
function getUserAccessType(authContext) {
  if (authContext?.internalAuthHeader) {
    return 'INTERNAL'
  }
  if (authContext?.externalAuthHeader) {
    return 'EXTERNAL'
  }
  return undefined
}

/**
 * Checks that the requester's end-user access type (internal/external) satisfies the given
 * `@auth` allow-list.
 * Unlike `checkAuthEntity`, ADMIN group membership does not bypass this check - the restriction is
 * on the type of end user, not the calling system.
 * A field with no `userType` restriction, or one including `ALL`, is unaffected.
 *
 * @throws {Unauthorized} if access is not granted
 */
export function checkUserAccess(authContext, allowedAccess) {
  if (!allowedAccess?.length || allowedAccess.includes('ALL')) {
    return
  }
  const userAccessType = getUserAccessType(authContext)
  if (!userAccessType || !allowedAccess.includes(userAccessType)) {
    throw new Unauthorized('Authorization failed, this field is not available to this user type')
  }
}

/**
 * Transforms the GraphQL schema description to enforce the `@auth` directive behaviour on types
 * and fields.
 *
 * @param {*} schema the GraphQL schema
 * @returns the compiled/codified/runnable equivalent of the behaviour described in the schema
 */
export function authDirectiveTransformer(schema) {
  const typeDirectiveArgumentMaps = {}
  const directiveName = 'auth'
  return mapSchema(schema, {
    [MapperKind.TYPE](type) {
      const authDirective = getDirective(schema, type, directiveName)?.[0]
      if (authDirective) {
        typeDirectiveArgumentMaps[type.name] = authDirective
      }
      return undefined
    },
    [MapperKind.OBJECT_FIELD](fieldConfig, _fieldName, typeName) {
      const authDirective =
        getDirective(schema, fieldConfig, directiveName)?.[0] ?? typeDirectiveArgumentMaps[typeName]

      const { resolve = defaultFieldResolver } = fieldConfig

      if (authDirective) {
        fieldConfig.resolve = function (source, args, context, info) {
          checkAuthEntity(context.auth.authName, authDirective.requires)
          checkServiceAccountAccess(
            isServiceAccount(context.authContext),
            isServiceAccountPermitted(schema, typeName),
            context.auth.authName === 'ADMIN'
          )
          checkUserAccess(context.authContext, authDirective.userType)
          return resolve(source, args, context, info)
        }
      }
      return fieldConfig
    }
  })
}
