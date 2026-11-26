import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cdpSchemaTranslator } from '../../../app/logger/winstonFormatters'

const params = new URLSearchParams([
  ['p1', 'v1'],
  ['p2', 'v2']
])
const headers = { h1: 'v1', h2: 'v2' }

const fixture = {
  code: 'RURALPAYMENTS_API_REQUEST_001',
  message: '#datasource - Rural payments - request',
  type: 'http',
  http: {
    request: {
      id: 'upstream-request',
      method: 'GET',
      other: 'stuff'
    },
    response: {
      mime_type: 'application/json',
      status_code: 200,
      other: 'stuff'
    }
  },
  level: 'info',
  '@timestamp': 1752678579327,
  gatewayType: 'external',
  request: {
    id: 'power-apps-req-id',
    method: 'POST',
    body: { searchFieldType: 'SBI', primarySearchPhrase: '890000001', offset: 0, limit: 1 },
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer token',
      email: 'probably.should@redacted.be',
      'x-cdp-request-id': '00000000-0000-0000-0000-000000000000'
    },
    retryCount: 1,
    params,
    path: 'http://localhost/path',
    url: 'http://localhost/path'
  },
  response: {
    headers,
    body: { data: 'some data' },
    statusCode: 200
  },
  requestTimeMs: 100,
  tenant: { id: 'tenant-id', message: 'some tenant info' },
  otherItems: 'will be omitted', // because they will be pruned by CDP's log processing
  traceId: 'trace-id'
}

describe('winstonFormatters', () => {
  describe('cdpSchemaTranslator', () => {
    beforeEach(() => {
      process.env.API_TENANT_ID = 'tenant-id'
    })

    afterEach(() => {
      delete process.env.API_TENANT_ID
    })

    it('should return a new object conforming to the CDP schema', () => {
      const error = new Error('test error')
      const result = cdpSchemaTranslator().transform({ error, ...fixture })
      expect(result).toEqual({
        message: '#datasource - Rural payments - request',
        level: 'info',
        'trace.id': 'trace-id',
        'span.id': 'trace-id',
        // NOTE: this example was built based on the CDP source schema config, found at:
        // https://portal.cdp-int.defra.cloud/documentation/how-to/logging.md#current-streamlined-ecs-schema-on-cdp
        error: {
          code: 'RURALPAYMENTS_API_REQUEST_001',
          type: 'Error',
          message: 'test error',
          stack_trace: error.stack
        },
        event: {
          action: 'gateway=external',
          category: 'RURALPAYMENTS_API_REQUEST_001',
          outcome: 'status code: 200',
          reference: 'http://localhost/path',
          type: 'POST',
          created: 1752678579327,
          duration: 100000000, // sfd-id-check: allow
          kind: 'http'
        },
        http: {
          request: {
            id: 'power-apps-req-id',
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              Authorization: 'Bearer token',
              email: 'probably.should@redacted.be',
              'x-cdp-request-id': '00000000-0000-0000-0000-000000000000'
            }
          },
          response: {
            status_code: 200,
            response_time: 100
          }
        },
        tenant: { id: 'tenant-id', message: 'some tenant info' },
        url: {
          full: 'http://localhost/path',
          path: 'http://localhost/path',
          query: '{"searchFieldType":"SBI","primarySearchPhrase":"*****0001"}'
        }
      })
    })
  })

  it('should handle request body as a string', () => {
    const result = cdpSchemaTranslator().transform({
      level: 'info',
      message: 'test message',
      request: { ...fixture.request, body: JSON.stringify(fixture.request.body) }
    })
    expect(result).toEqual({
      level: 'info',
      message: 'test message',
      event: {
        reference: 'http://localhost/path',
        type: 'POST'
      },
      http: {
        request: {
          id: 'power-apps-req-id',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer token',
            email: 'probably.should@redacted.be',
            'x-cdp-request-id': '00000000-0000-0000-0000-000000000000'
          }
        }
      },
      url: {
        full: 'http://localhost/path',
        path: 'http://localhost/path',
        query: '{"searchFieldType":"SBI","primarySearchPhrase":"*****0001"}'
      }
    })
  })

  it('should return a reduced object when only partial info is provided', () => {
    expect(cdpSchemaTranslator().transform({ level: 'info', message: 'msg' })).toEqual({
      level: 'info',
      message: 'msg'
    })
    expect(
      cdpSchemaTranslator().transform({ level: 'info', message: 'msg', request: { id: 'req-id' } })
    ).toEqual({
      level: 'info',
      message: 'msg',
      http: { request: { id: 'req-id' } }
    })
    expect(
      cdpSchemaTranslator().transform({ level: 'info', message: 'msg', requestTimeMs: 100 })
    ).toEqual({
      level: 'info',
      message: 'msg',
      event: { duration: 100000000 }, // sfd-id-check: allow
      http: { response: { response_time: 100 } }
    })
    expect(cdpSchemaTranslator().transform({ '@timestamp': 100 })).toEqual({
      event: { created: 100 },
      level: undefined,
      message: undefined
    })
    expect(cdpSchemaTranslator().transform({ error: { message: 'error' } })).toEqual({
      level: undefined,
      message: undefined,
      error: { message: 'error' } // must pick up partial error details
    })
  })

  describe('buildHttpDetails', () => {
    it('uses response.statusCode for status_code when present', () => {
      const result = cdpSchemaTranslator().transform({
        response: { statusCode: 201 }
      })
      expect(result.http.response.status_code).toBe(201)
    })

    it('falls back to response.status for status_code when statusCode is absent', () => {
      const result = cdpSchemaTranslator().transform({
        response: { status: 404 }
      })
      expect(result.http.response.status_code).toBe(404)
    })

    it('omits status_code when neither statusCode nor status is present', () => {
      const result = cdpSchemaTranslator().transform({
        response: { body: 'something' }
      })
      expect(result.http.response).not.toHaveProperty('status_code')
    })
  })

  describe('pickKeysForLogging ', () => {
    it('only allows whitelisted keys from object body', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          body: {
            crn: 'CRN001',
            customerReferenceNumber: 'CRN002',
            sbi: '823456789',
            primarySearchPhrase: 'john doe',
            searchFieldType: 'name',
            id: 'user-123',
            password: 'secret',
            creditCard: '4111111111111111',
            nested: { crn: 'nested-crn', junk: 'remove' },
            array: [{ id: 'allowed' }, { secret: 'remove' }],
            other: {
              crn: null
            },
            empty: null
          }
        }
      })

      expect(JSON.parse(result.url.query)).toEqual({
        crn: '**N001',
        customerReferenceNumber: '**N002',
        sbi: '*****6789',
        searchFieldType: 'name',
        id: '****-123',
        nested: { crn: '******-crn' },
        array: [{ id: '***owed' }],
        other: {
          crn: null
        }
      })
    })

    it('masks crn and customerReferenceNumber, keeping only the last 4 characters', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          body: {
            crn: '9234567890',
            customerReferenceNumber: '9876543210',
            shortCrn: 'ab', // key not masked, but also under 4 chars — included verbatim
            nested: { crn: '5555' } // exactly 4 chars, nothing to mask
          }
        }
      })

      expect(JSON.parse(result.url.query)).toEqual({
        crn: '******7890',
        customerReferenceNumber: '******3210',
        nested: { crn: '5555' }
      })
    })

    it('masks numeric values of masked keys (e.g. a personId or orgId sent as a number)', () => {
      const result = cdpSchemaTranslator().transform({
        request: { body: { id: 5565448, sbi: 823456789, crn: 9234567890 } }
      })

      expect(JSON.parse(result.url.query)).toEqual({
        id: '***5448',
        sbi: '*****6789',
        crn: '******7890'
      })
    })

    it.each([
      ['plain text', 'test@test.com'],
      ['a JSON string', '"test@test.com"']
    ])('does not log a %s body', (_, body) => {
      const result = cdpSchemaTranslator().transform({
        request: { body, path: '/verify-email/1' }
      })

      expect(result.url).toEqual({ path: '/verify-email/1', full: '/verify-email/1' })
    })

    it('excludes primarySearchPhrase entirely, since it may hold a crn, name or postcode', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          body: {
            sbi: '887654321',
            primarySearchPhrase: 'jane doe',
            allowed: 'no',
            disallowed: 'yes'
          }
        }
      })

      expect(JSON.parse(result.url.query)).toEqual({
        sbi: '*****4321'
      })
    })

    it('works when body is a JSON string', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          body: JSON.stringify({
            sbi: '887654321',
            primarySearchPhrase: 'jane doe',
            allowed: 'no',
            disallowed: 'yes'
          })
        }
      })

      expect(JSON.parse(result.url.query)).toEqual({
        sbi: '*****4321'
      })
    })

    describe('primarySearchPhrase, based on sibling searchFieldType', () => {
      it.each(['VENDOR_NUMBER', 'TRADER_NUMBER', 'PERSONAL_IDENTIFIER'])(
        'logs primarySearchPhrase when searchFieldType is %s',
        (searchFieldType) => {
          const result = cdpSchemaTranslator().transform({
            request: {
              body: { searchFieldType, primarySearchPhrase: 'ABC123' }
            }
          })

          expect(JSON.parse(result.url.query)).toEqual({
            searchFieldType,
            primarySearchPhrase: 'ABC123'
          })
        }
      )

      it.each(['BUSINESS_NAME', 'BUSINESS_POSTCODE', 'CUSTOMER_NAME', 'CUSTOMER_POSTCODE', 'CRN'])(
        'excludes primarySearchPhrase when searchFieldType is %s',
        (searchFieldType) => {
          const result = cdpSchemaTranslator().transform({
            request: {
              body: { searchFieldType, primarySearchPhrase: 'jane doe' }
            }
          })

          expect(JSON.parse(result.url.query)).toEqual({ searchFieldType })
        }
      )

      it.each([
        // CUSTOMER_REFERENCE is the wire-level CRN search type
        ['CUSTOMER_REFERENCE', '9234567890', '******7890'],
        ['SBI', '823456789', '*****6789']
      ])(
        'masks primarySearchPhrase to the last 4 digits when searchFieldType is %s',
        (searchFieldType, primarySearchPhrase, masked) => {
          const result = cdpSchemaTranslator().transform({
            request: {
              body: { searchFieldType, primarySearchPhrase }
            }
          })

          expect(JSON.parse(result.url.query)).toEqual({
            searchFieldType,
            primarySearchPhrase: masked
          })
        }
      )
    })

    it('masks an sbi nested in objects and arrays', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          body: {
            business: { sbi: '823456789' },
            businesses: [{ sbi: '887654321' }, { sbi: '811111111', name: 'remove' }]
          }
        }
      })

      expect(JSON.parse(result.url.query)).toEqual({
        business: { sbi: '*****6789' },
        businesses: [{ sbi: '*****4321' }, { sbi: '*****1111' }]
      })
    })
  })

  describe('masking SBI/CRN-like numbers in free text', () => {
    it('masks them in the log message', () => {
      const result = cdpSchemaTranslator().transform({
        message: 'organisation not found for SBI 823456789 and CRN 9234567890'
      })

      expect(result.message).toBe('organisation not found for SBI *****6789 and CRN ******7890')
    })

    it('masks them in the error message and stack trace', () => {
      const error = new Error('E11000 duplicate key error dup key: { _id: "823456789" }')

      const result = cdpSchemaTranslator().transform({ message: 'failed', error })

      expect(result.error.message).toBe('E11000 duplicate key error dup key: { _id: "*****6789" }')
      expect(result.error.stack_trace).toContain('{ _id: "*****6789" }')
      expect(result.error.stack_trace).not.toContain('823456789')
    })

    it('does not mask tenant.message, which holds 10 digit epoch times', () => {
      const message = JSON.stringify({ iat: 9795609233, exp: 9795612833 })

      const result = cdpSchemaTranslator().transform({ message: 'decoded', tenant: { message } })

      expect(result.tenant.message).toBe(message)
    })
  })

  describe('buildEvent', () => {
    it('uses the path portion of a full URL as event.reference', () => {
      const result = cdpSchemaTranslator().transform({
        level: 'info',
        message: 'test',
        request: { path: 'https://api.example.com/organisation/123/details' }
      })
      expect(result.event.reference).toBe('/organisation/123/details')
    })

    it('never sets event.reason', () => {
      // arrange / act
      const result = cdpSchemaTranslator().transform({
        level: 'info',
        message: 'test',
        response: { status: 200 },
        reason: 'something'
      })

      // assert
      expect(result.event).not.toHaveProperty('reason')
    })
  })

  describe('buildGraphqlDetails', () => {
    it('logs the operation type, name and error codes under graphql', () => {
      // arrange / act
      const result = cdpSchemaTranslator().transform({
        level: 'info',
        message: 'test',
        graphql: {
          operationType: 'mutation',
          operationName: 'CreateBusiness',
          errorCodes: ['NOT FOUND', 'FORBIDDEN']
        }
      })

      // assert
      expect(result.graphql).toEqual({
        operationType: 'mutation',
        operationName: 'CreateBusiness',
        errorCodes: ['NOT FOUND', 'FORBIDDEN']
      })
    })

    it('logs only the fields that are set', () => {
      // arrange / act
      const result = cdpSchemaTranslator().transform({
        level: 'info',
        message: 'test',
        graphql: { operationType: 'query', operationName: undefined, errorCodes: [] }
      })

      // assert
      expect(result.graphql).toEqual({ operationType: 'query' })
    })

    it('omits graphql when none of its fields are set', () => {
      // arrange / act
      const result = cdpSchemaTranslator().transform({
        level: 'info',
        message: 'test',
        graphql: {}
      })

      // assert
      expect(result).not.toHaveProperty('graphql')
    })

    it('omits graphql when it is not provided', () => {
      // arrange / act
      const result = cdpSchemaTranslator().transform({ level: 'info', message: 'test' })

      // assert
      expect(result).not.toHaveProperty('graphql')
    })

    it('does not log unknown fields given under graphql', () => {
      // arrange / act
      const result = cdpSchemaTranslator().transform({
        level: 'info',
        message: 'test',
        graphql: { operationType: 'query', variables: { sbi: '812345678' } }
      })

      // assert
      expect(result.graphql).toEqual({ operationType: 'query' })
    })

    describe('outcome', () => {
      it('omits event.outcome when no response is provided', () => {
        const result = cdpSchemaTranslator().transform({ level: 'info', message: 'test' })
        expect(result.event).not.toBeDefined()
      })

      it('sets event.outcome from response.status', () => {
        const result = cdpSchemaTranslator().transform({ response: { status: 404 } })
        expect(result.event.outcome).toBe('status code: 404')
      })

      it('sets event.outcome from response.statusCode', () => {
        const result = cdpSchemaTranslator().transform({ response: { statusCode: 201 } })
        expect(result.event.outcome).toBe('status code: 201')
      })
    })
  })

  describe('buildUrl', () => {
    it('sets url.full and url.path when request.path is a full URL string', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: 'https://api.example.com/organisation/123' }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/organisation/123',
        path: '/organisation/123'
      })
    })

    it('sets url.full and url.path when request.path is a URL object', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: new URL('https://api.example.com/organisation/123') }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/organisation/123',
        path: '/organisation/123'
      })
    })

    it('sets url.path (and url.full for completeness, even though it`s not a full path) when request.path is a path-only string', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: '/organisation/123' }
      })
      expect(result.url).toEqual({ full: '/organisation/123', path: '/organisation/123' })
    })

    it('sets no url field when request has no path', () => {
      const result = cdpSchemaTranslator().transform({
        request: { method: 'GET' }
      })
      expect(result.url).not.toBeDefined()
    })

    it('uses url as full and path as-is when both are supplied', () => {
      const result = cdpSchemaTranslator().transform({
        request: { url: 'https://api.example.com/organisation/123', path: '/organisation/123' }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/organisation/123',
        path: '/organisation/123'
      })
    })

    it('sets url.full and url.path when request.url is a full URL string', () => {
      const result = cdpSchemaTranslator().transform({
        request: { url: 'https://api.example.com/organisation/123' }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/organisation/123',
        path: '/organisation/123'
      })
    })

    it('sets url.full and url.path when request.url is a path-only string', () => {
      const result = cdpSchemaTranslator().transform({
        request: { url: '/organisation/123' }
      })
      expect(result.url).toEqual({ full: '/organisation/123', path: '/organisation/123' })
    })

    it('masks the crn segment of an external-auth security-answers path', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: '/external-auth/security-answers/9234567890' }
      })
      expect(result.url).toEqual({
        full: '/external-auth/security-answers/******7890',
        path: '/external-auth/security-answers/******7890'
      })
    })

    it('masks the crn segment of a full external-auth security-answers URL', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: 'https://api.example.com/external-auth/security-answers/9234567890' }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/external-auth/security-answers/******7890',
        path: '/external-auth/security-answers/******7890'
      })
    })

    it('masks the crn segment when both url and path are supplied', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          url: 'https://api.example.com/external-auth/security-answers/9234567890',
          path: '/external-auth/security-answers/9234567890'
        }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/external-auth/security-answers/******7890',
        path: '/external-auth/security-answers/******7890'
      })
    })

    it('masks any numeric path segment', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: 'https://api.example.com/organisation/5565448/person/9999999999/summary' }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/organisation/***5448/person/******9999/summary',
        path: '/organisation/***5448/person/******9999/summary'
      })
    })

    it('masks an email path segment', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: '/person/someone@example.com/validateEmail' }
      })
      expect(result.url).toEqual({
        full: '/person/***************.com/validateEmail',
        path: '/person/***************.com/validateEmail'
      })
    })

    it('masks a URL-encoded email path segment', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: 'https://api.example.com/person/someone%40example.com/validateEmail' }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/person/*****************.com/validateEmail',
        path: '/person/*****************.com/validateEmail'
      })
    })

    it('masks numeric and email query string values', () => {
      const result = cdpSchemaTranslator().transform({
        request: {
          path: 'https://api.example.com/person/search?crn=9999999999&email=someone%40example.com&page=1'
        }
      })
      expect(result.url).toEqual({
        full: 'https://api.example.com/person/search?crn=******9999&email=*****************.com&page=1',
        path: '/person/search'
      })
    })

    it('masks query string values on a path-only URL', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: '/person/search?email=someone@example.com' }
      })
      expect(result.url).toEqual({
        full: '/person/search?email=***************.com',
        path: '/person/search?email=***************.com'
      })
    })

    it('does not mask the host, port or non-PII path segments and query values', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: 'http://localhost:12345/v1/organisation-search?sort=name&page=12345' }
      })
      expect(result.url).toEqual({
        full: 'http://localhost:12345/v1/organisation-search?sort=name&page=*2345',
        path: '/v1/organisation-search'
      })
    })

    it('does not mask segments that only partly contain a number or email', () => {
      const result = cdpSchemaTranslator().transform({
        request: { path: '/abc12345/someone@example' }
      })
      expect(result.url).toEqual({
        full: '/abc12345/someone@example',
        path: '/abc12345/someone@example'
      })
    })
  })
})
