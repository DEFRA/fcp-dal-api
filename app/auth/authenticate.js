import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { Unit } from 'aws-embedded-metrics'
import { defaultFieldResolver } from 'graphql'
import { decodeProtectedHeader, jwtVerify } from 'jose'
import { config } from '../config.js'
import { Unauthorized } from '../errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { sendMetric } from '../logger/sendMetric.js'
import { maskAllButLastFour } from '../logger/utils.js'

export const authGroups = config.get('auth.groups')

const authGroupServiceName = {
  [authGroups.ADMIN]: null,
  [authGroups.CONSOLIDATED_VIEW]: 'consolidated-view',
  [authGroups.SFI_REFORM]: 'grants-platform',
  [authGroups.SINGLE_FRONT_DOOR]: 'single-front-door'
}

export async function getAuth(request, jwkDatasource) {
  try {
    const token = request?.headers?.authorization?.split(' ')[1]
    if (!token) {
      return {}
    }
    logger.debug('#DAL - Request authentication - Check verification', {
      code: DAL_REQUEST_AUTHENTICATION_001,
      request: { remoteAddress: request?.info?.remoteAddress }
    })
    const decodedToken = decodeProtectedHeader(token)
    const requestStart = Date.now()
    const signingKey = await jwkDatasource.getPublicKey(decodedToken.kid)
    const requestTimeMs = Date.now() - requestStart
    const { payload: verified } = await jwtVerify(token, signingKey, {
      algorithms: ['RS256']
    })
    sendMetric('RequestTime', requestTimeMs, Unit.Milliseconds, {
      code: DAL_REQUEST_AUTHENTICATION_001
    })

    logger.info('#DAL Request authentication - JWT verified', {
      type: 'http',
      code: DAL_REQUEST_AUTHENTICATION_001,
      requestTimeMs,
      request: {
        remoteAddress: request?.info?.remoteAddress
      },
      tenant: {
        message: JSON.stringify({
          appid: verified.appid,
          aud: verified.aud,
          oid: verified.oid,
          serviceId: verified.serviceId,
          correlationId: verified.correlationId,
          currentRelationshipId: verified.currentRelationshipId,
          sessionId: verified.sessionId,
          sub: verified.sub,
          tid: verified.tid,
          email: verified.email?.split('@')[1],
          contactId: maskAllButLastFour(verified.contactId),
          relationships: verified.relationships,
          groups: verified.groups,
          roles: verified.roles,
          azp: verified.azp
        })
      }
    })

    return verified
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.code === 'ERR_JWT_EXPIRED' ||
      error.name === 'JWTExpired'
    ) {
      logger.warn('#DAL - request authentication - token expired', {
        error,
        code: DAL_REQUEST_AUTHENTICATION_001,
        request: { remoteAddress: request?.info?.remoteAddress }
      })
    } else {
      logger.error('#DAL - request authentication - Error verifying jwt', {
        error,
        code: DAL_REQUEST_AUTHENTICATION_001,
        request: { remoteAddress: request?.info?.remoteAddress }
      })
    }
    return {}
  }
}

/**
 * Returns the requesting service name based on the security groups.
 * Note: this will likely switch to using the appid see (https://eaflood.atlassian.net/browse/FCPDAL-490)
 * however using groups for now for consistency with our permission model.
 * @param {string[]} groups
 * @returns the calling service or null if service wasn't identified
 */
export function getRequestingService(groups) {
  // Return a placeholder service name, when auth is disabled.
  if (config.get('auth.disabled')) {
    return 'auth-disabled'
  }
  return (
    groups.map((group) => authGroupServiceName[group]).find((serviceName) => !!serviceName) ?? null
  )
}

export function getRequestingGroup(groups) {
  // Return mock UUID when auth is disabled in local/dev
  if (config.get('auth.disabled')) {
    return '00000000-0000-0000-0000-000000000000'
  }

  return groups?.find((group) => Object.values(authGroups).includes(group))
}

/**
 * ADMIN group membership bypasses both the @auth group check and the serviceAccountPermitted gate.
 */
export function isAdminCaller(requesterGroups) {
  return requesterGroups.includes(authGroups.ADMIN)
}

/**
 * Check if the caller is a service account.
 * @param authContext the auth context
 * @returns {boolean} true if the caller is a service account, false otherwise
 */
function isServiceAccount(authContext) {
  return !!authContext?.serviceAccount
}

function isServiceAccountPermitted(schema, authDirective, typeName) {
  const mutationTypeName = schema.getMutationType()?.name
  const isMutationField = typeName === mutationTypeName

  // If directive value is supplied, use that, otherwise mutation fields default to false and
  // non-mutation fields are true
  return authDirective?.serviceAccountPermitted ?? !isMutationField
}

/**
 * Checks that the requester's groups satisfy the given @auth allow-list.
 * @throws {Unauthorized} if access is not granted
 */
export function checkAuthGroup(requesterGroups, allowedGroups) {
  if (isAdminCaller(requesterGroups)) {
    return
  } else {
    const hasAccess = allowedGroups.some((group) => {
      const authGroupValue = authGroups[group]
      return authGroupValue && requesterGroups.includes(authGroupValue)
    })
    if (!hasAccess) {
      throw new Unauthorized('Authorization failed, you are not in the correct AD groups')
    }
  }
}

/**
 * A field guarded by @auth is usable by a service-account caller according to the following:
 *  - if caller has ADMIN membership, always permitted
 *  - if serviceAccountPermitted value supplied, the value on the directive is used
 *  - if serviceAccountPermitted value is not supplied, defaults to true (permitted) on a Query field
 *    or false (denied) on a Mutation field
 */
export function checkServiceAccountAccess(isServiceAccount, serviceAccountPermitted, isAdmin) {
  if (isServiceAccount && !serviceAccountPermitted && !isAdmin) {
    throw new Unauthorized('Authorization failed, this field is not available to service accounts')
  }
}

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
          const requesterGroups = context.auth.groups || []
          checkAuthGroup(requesterGroups, authDirective.requires)
          checkServiceAccountAccess(
            isServiceAccount(context.authContext),
            isServiceAccountPermitted(schema, authDirective, typeName),
            isAdminCaller(requesterGroups)
          )
          return resolve(source, args, context, info)
        }
      }
      return fieldConfig
    }
  })
}
