import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { Unit } from 'aws-embedded-metrics'
import { defaultFieldResolver } from 'graphql'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { Unauthorized } from '../errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { sendMetric } from '../logger/sendMetric.js'

export const authGroups = config.get('auth.groups')

export async function getAuth(request, jwkDatasource) {
  try {
    const authHeader = request?.headers?.authorization
    if (!authHeader) {
      return {}
    }
    logger.debug('#DAL - Request authentication - Check verification', {
      code: DAL_REQUEST_AUTHENTICATION_001,
      request: {
        remoteAddress: request?.info?.remoteAddress
      }
    })
    const token = authHeader.split(' ')[1]
    const decodedToken = jwt.decode(token, { complete: true })
    const header = decodedToken.header
    const requestStart = Date.now()
    const signingKey = await jwkDatasource.getPublicKey(header.kid)
    const requestTimeMs = Date.now() - requestStart
    const verified = jwt.verify(token, signingKey)
    sendMetric('RequestTime', requestTimeMs, Unit.Milliseconds, {
      code: DAL_REQUEST_AUTHENTICATION_001
    })

    logger.info('#DAL Request authentication - JWT verified', {
      type: 'http',
      code: DAL_REQUEST_AUTHENTICATION_001,
      requestTimeMs,
      request: {
        remoteAddress: request?.info?.remoteAddress
      }
    })
    return verified
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('#DAL - request authentication - token expired', {
        error,
        code: DAL_REQUEST_AUTHENTICATION_001,
        request: {
          remoteAddress: request?.info?.remoteAddress
        }
      })
    } else {
      logger.error('#DAL - request authentication - Error verifying jwt', {
        error,
        code: DAL_REQUEST_AUTHENTICATION_001,
        request: {
          remoteAddress: request?.info?.remoteAddress
        }
      })
    }
    return {}
  }
}

export function checkAuthGroup(requesterGroups, allowedGroups) {
  const isAdmin = requesterGroups.includes(authGroups.ADMIN)
  if (isAdmin) {
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
          checkAuthGroup(context.auth.groups || [], authDirective.requires)
          return resolve(source, args, context, info)
        }
      }
      return fieldConfig
    }
  })
}
