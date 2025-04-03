import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import { defaultFieldResolver } from 'graphql'
import { HttpsProxyAgent } from 'https-proxy-agent'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { Unauthorized } from '../errors/graphql.js'
import { AuthRole } from '../graphql/resolvers/authenticate.js'
import { DAL_REQUEST_AUTHENTICATION_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'

export async function getJwtPublicKey(kid) {
  let client
  if (process.env.NODE_ENV != 'test') {
    client = jwksClient({
      jwksUri: process.env.OIDC_JWKS_URI,
      requestAgent: new HttpsProxyAgent(process.env.CDP_HTTPS_PROXY)
    })
  } else {
    client = jwksClient({
      jwksUri: process.env.OIDC_JWKS_URI
    })
  }

  const key = await client.getSigningKey(kid)
  return key.getPublicKey()
}

export async function getAuth(request, getJwtPublicKeyFunc = getJwtPublicKey) {
  try {
    const authHeader = request?.headers?.authorization
    if (!authHeader) {
      return {}
    }
    logger.verbose('#DAL - Request authentication - Check verification', {
      code: DAL_REQUEST_AUTHENTICATION_001,
      request: {
        remoteAddress: request?.info?.remoteAddress
      }
    })
    const token = authHeader.split(' ')[1]
    const decodedToken = jwt.decode(token, { complete: true })
    const header = decodedToken.header
    const requestStart = Date.now()
    const signingKey = await getJwtPublicKeyFunc(header.kid)
    const requestTimeMs = Date.now() - requestStart
    const verified = jwt.verify(token, signingKey)
    logger.http('#DAL Request authentication - JWT verified', {
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

export function checkAuthGroup(userGroups, groupId) {
  if (!userGroups.includes(groupId)) {
    throw new Unauthorized('Authorization failed, you are not in the correct AD groups')
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
      const requires = authDirective ? authDirective.requires : AuthRole.ADMIN
      const { resolve = defaultFieldResolver } = fieldConfig
      fieldConfig.resolve = function (source, args, context, info) {
        checkAuthGroup(context.auth.groups || [], requires)
        return resolve(source, args, context, info)
      }
      return fieldConfig
    }
  })
}
