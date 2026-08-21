import { endUserAuthContext } from '../../../app/auth/end-user-auth-context.js'
import { Unauthorized } from '../../../app/errors/graphql.js'

describe('endUserAuthContext', () => {
  test('returns auth headers extracted from the request', () => {
    const request = {
      headers: {
        email: 'user@example.com',
        'x-forwarded-authorization': 'token123',
        'service-account': 'service@example.com'
      }
    }

    const result = endUserAuthContext(request)

    expect(result).toEqual({
      internalAuthHeader: 'user@example.com',
      externalAuthHeader: 'token123',
      serviceAccount: 'service@example.com'
    })
  })

  test('throws Unauthorized when the email header contains "robot-account." (case insensitive)', () => {
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
