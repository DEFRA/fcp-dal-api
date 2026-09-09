import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { endUserAuthContext } from '../../../app/auth/end-user-auth-context.js'
import { Unauthorized } from '../../../app/errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_001 } from '../../../app/logger/codes.js'
import { logger } from '../../../app/logger/logger.js'

describe('endUserAuthContext', () => {
  let loggerErrorSpy

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    loggerErrorSpy.mockRestore()
  })

  test('returns auth headers extracted from the request, logging the conflicting email/external-auth headers', () => {
    const request = {
      headers: {
        email: 'user@example.com',
        'x-forwarded-authorization': 'token123'
      }
    }

    const result = endUserAuthContext(request)

    expect(result).toEqual({
      upstreamEmailHeader: 'user@example.com',
      internalAuthHeader: 'user@example.com',
      externalAuthHeader: 'token123',
      serviceAccount: undefined
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '#DAL - Request authentication - conflicting auth headers',
      expect.objectContaining({ code: DAL_REQUEST_AUTHENTICATION_001 })
    )
  })

  test('does not log when only an email header is present', () => {
    const request = { headers: { email: 'user@example.com' } }

    endUserAuthContext(request)

    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  test('does not log when an x-forwarded-authorization header is supplied alongside a service-account header', () => {
    // The DAL itself legitimately injects a service-account header onto an already-external
    // request to take over routing (the dal-service-account authType) - this must not be logged.
    const request = {
      headers: {
        'x-forwarded-authorization': 'token123',
        'service-account': 'service@example.com'
      }
    }

    endUserAuthContext(request)

    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  test('does not log when only an x-forwarded-authorization header is present', () => {
    const request = { headers: { 'x-forwarded-authorization': 'token123' } }

    endUserAuthContext(request)

    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  test('throws Unauthorized when both email and service-account headers are present', () => {
    const request = {
      headers: {
        email: 'user@example.com',
        'service-account': 'service@example.com'
      }
    }

    expect(() => endUserAuthContext(request)).toThrow(Unauthorized)
    expect(() => endUserAuthContext(request)).toThrow(
      'Cannot supply both email and service-account headers'
    )
  })

  test('returns service account as the upstream email header when client request email header is not set', () => {
    const request = {
      headers: {
        'service-account': 'service@example.com'
      }
    }

    const result = endUserAuthContext(request)

    expect(result).toEqual(
      expect.objectContaining({
        upstreamEmailHeader: 'service@example.com'
      })
    )
  })

  test('throws Unauthorized when the email header contains "robot-account." (case-insensitive)', () => {
    const request = {
      headers: {
        email: 'Robot-Account.something@example.com'
      }
    }

    expect(() => endUserAuthContext(request)).toThrow(Unauthorized)
    expect(() => endUserAuthContext(request)).toThrow('Service accounts must not use email header')
  })

  test('does not throw when the email header does not contain "robot-account."', () => {
    const request = {
      headers: {
        email: 'user@example.com'
      }
    }

    expect(() => endUserAuthContext(request)).not.toThrow()
  })

  test('does not throw when no email header is present', () => {
    const request = {
      headers: {}
    }

    expect(() => endUserAuthContext(request)).not.toThrow()
  })
})
