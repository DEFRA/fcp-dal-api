import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { defaultFieldResolver } from 'graphql'
import { MapperKind, getDirective, mapSchema } from '@graphql-tools/utils'

import { logger } from '../utils/logger.js'
import { Unauthorized } from '../errors/graphql.js'
import { AuthRole } from '../graphql/resolvers/authenticate.js'

export async function getJwtPublicKey (kid) {
  const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${process.env.API_TENANT_ID}/discovery/v2.0/keys`
  })
  const key = await client.getSigningKey(kid)
  return key.getPublicKey()
}

export async function getAuth (request, getJwtPublicKeyFunc = getJwtPublicKey) {
  try {
    const authHeader = request?.headers?.authorization
    if (!authHeader) {
      return {}
    }
    const token = authHeader.split(' ')[1]
    const decodedToken = jwt.decode(token, { complete: true })
    const header = decodedToken.header
    const signingKey = await getJwtPublicKeyFunc(header.kid)
    return jwt.verify(token, signingKey)
  } catch (error) {
    logger.error('#authenticate - Error verifying jwt', { error })
    return {}
  }
}

export function checkAuthGroup (userGroups, groupId) {
  if (!userGroups.includes(groupId)) {
    throw new Unauthorized(
      'Authorization failed, you are not in the correct AD groups'
    )
  }
}

export function authDirectiveTransformer (schema) {
  const typeDirectiveArgumentMaps = {}
  const directiveName = 'auth'
  return mapSchema(schema, {
    [MapperKind.TYPE] (type) {
      const authDirective = getDirective(schema, type, directiveName)?.[0]
      if (authDirective) {
        typeDirectiveArgumentMaps[type.name] = authDirective
      }
      return undefined
    },
    [MapperKind.OBJECT_FIELD] (fieldConfig, _fieldName, typeName) {
      const authDirective =
        getDirective(schema, fieldConfig, directiveName)?.[0] ??
        typeDirectiveArgumentMaps[typeName]
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
