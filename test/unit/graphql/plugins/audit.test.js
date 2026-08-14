import { afterEach, describe, expect, jest, test } from '@jest/globals'
import { validateAuditEvent } from '@defra/fcp-audit-publisher'

const getRequestingGroupMock = jest.fn()
const configGetMock = jest.fn()
const extractCrnFromDefraIdTokenMock = jest.fn()
const loggerMock = { error: jest.fn(), debug: jest.fn(), warn: jest.fn() }
const snsPublishMock = jest.fn()

jest.unstable_mockModule('../../../../app/auth/authenticate.js', () => ({
  getRequestingGroup: getRequestingGroupMock
}))
jest.unstable_mockModule('../../../../app/auth/defra-id.js', () => ({
  extractCrnFromDefraIdToken: extractCrnFromDefraIdTokenMock
}))
jest.unstable_mockModule('../../../../app/config.js', () => ({
  config: { get: configGetMock }
}))
jest.unstable_mockModule('../../../../app/logger/logger.js', () => ({
  logger: loggerMock
}))
jest.unstable_mockModule('../../../../app/audit/sns-publisher.js', () => ({
  snsPublish: snsPublishMock
}))

// ENVIRONMENT_NAME is computed once, at module load time, from config.get('cdp.env') - fixed to
// 'dev' for every test in this file by default. The one test that cares about the 'local'
// fallback branch resets the module registry and re-imports fresh after changing this mock.
const configMockPath = { 'cdp.env': 'dev' }
configGetMock.mockImplementation((path) => configMockPath[path])

const { auditPlugin } = await import('../../../../app/graphql/plugins/audit.js')

const fakeAuditTrail = (byRoot = {}) => ({
  rootKeys: jest.fn(() => Object.keys(byRoot)),
  getForRoot: jest.fn((rootKey) => byRoot[rootKey] ?? {}),
  serviceAccount: jest.fn(() => undefined)
})

const requestPayload = {
  query: 'query GetBusiness { business { id } }',
  variables: { sbi: '123456789' },
  operationName: 'GetBusiness'
}

const REQUEST_RECEIVED_MS = Date.parse('2026-01-01T00:00:00.000Z')

const baseContextValue = {
  requestLogger: { error: jest.fn() },
  request: {
    headers: { 'x-forwarded-for': '203.0.113.5', email: 'internal@example.com' },
    info: { remoteAddress: '0.0.0.0', received: REQUEST_RECEIVED_MS },
    traceId: 'trace-1',
    payload: requestPayload
  },
  auth: { groups: ['group-1'] },
  auditTrail: fakeAuditTrail()
}

describe('auditPlugin', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('publish', () => {
    test('publishes exactly one event for a root selection with a recorded entity, shaped as an AuditEventPayload', async () => {
      getRequestingGroupMock.mockReturnValue('SOME_AD_GROUP')
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledTimes(1)
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationid: 'trace-1',
          environment: 'cdp-dev',
          version: '1.0.0',
          application: 'Data Access Layer',
          component: 'fcp-dal-api',
          ip: '203.0.113.5',
          user: 'internal@example.com',
          audit: expect.objectContaining({
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }],
            status: 'success',
            details: expect.objectContaining({
              requestBody: JSON.stringify(requestPayload),
              rootField: 'business',
              sourceSystem: 'SOME_AD_GROUP',
              sourceSystemSecurityGroupId: 'SOME_AD_GROUP',
              errorDetails: []
            })
          })
        }),
        baseContextValue.requestLogger
      )
    })

    test('publishes a synthetic audit event when no explicit entities have been tracked for a root selection', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { accounts: { sbi: '123456789' } }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledTimes(1)
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            entities: [{ entity: 'audit', action: 'created', entityid: 'trace-1' }],
            accounts: { sbi: '123456789' }
          })
        }),
        baseContextValue.requestLogger
      )
    })

    test('publishes one event per root selection when the query aliases the same root field twice', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business1: {
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }],
            accounts: { sbi: '111' }
          },
          business2: {
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-2' }],
            accounts: { sbi: '222' }
          }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = {
        operationName: 'YoureHavingALaughAtMyExpense',
        contextValue,
        errors: undefined
      }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledTimes(2)
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }],
            accounts: { sbi: '111' },
            details: expect.objectContaining({ rootField: 'business1' })
          })
        }),
        baseContextValue.requestLogger
      )
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-2' }],
            accounts: { sbi: '222' },
            details: expect.objectContaining({ rootField: 'business2' })
          })
        }),
        baseContextValue.requestLogger
      )
    })

    test('publishes a single fallback event for the request when the audit trail has no root selections (e.g. a parse/validation error)', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = { ...baseContextValue, auditTrail: fakeAuditTrail() }
      const listener = await plugin.requestDidStart()
      const requestContext = {
        contextValue,
        errors: [
          { message: 'Syntax Error', path: undefined, extensions: { code: 'GRAPHQL_PARSE_FAILED' } }
        ]
      }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledTimes(1)
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            status: 'failure',
            entities: [{ entity: 'audit', action: 'created', entityid: 'trace-1' }],
            details: expect.objectContaining({
              rootField: undefined,
              errorDetails: [
                { message: 'Syntax Error', path: undefined, code: 'GRAPHQL_PARSE_FAILED' }
              ]
            })
          })
        }),
        baseContextValue.requestLogger
      )
    })

    test('publishes nothing when contextValue has no auditTrail at all', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const listener = await plugin.requestDidStart()
      const requestContext = {
        contextValue: { requestLogger: baseContextValue.requestLogger },
        errors: undefined
      }
      await listener.willSendResponse(requestContext)

      expect(publish).not.toHaveBeenCalled()
    })
  })

  describe('user', () => {
    test('uses the internal auth header when present', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        request: {
          ...baseContextValue.request,
          headers: {
            email: 'internal@example.com',
            // Although all 3 will never be present at the same time, included to show that email will be selected
            'service-account': 'service-account@example.com',
            'x-forwarded-authorization': 'the-defra-id-token'
          }
        },
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'internal@example.com' }),
        baseContextValue.requestLogger
      )
      expect(extractCrnFromDefraIdTokenMock).not.toHaveBeenCalled()
    })

    test('uses the service account when there is no internal auth header', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        request: {
          ...baseContextValue.request,
          headers: {
            'service-account': 'service-account@example.com',
            'x-forwarded-authorization': 'the-defra-id-token'
          }
        },
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'service-account@example.com' }),
        baseContextValue.requestLogger
      )
      expect(extractCrnFromDefraIdTokenMock).not.toHaveBeenCalled()
    })

    test('falls back to the DefraID CRN, prefixed IDM/, when there is neither an internal auth header nor a service account', async () => {
      extractCrnFromDefraIdTokenMock.mockReturnValue('crn-123')
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        request: {
          ...baseContextValue.request,
          headers: { 'x-forwarded-authorization': 'the-defra-id-token' }
        },
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(extractCrnFromDefraIdTokenMock).toHaveBeenCalledWith('the-defra-id-token')
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'IDM/crn-123' }),
        baseContextValue.requestLogger
      )
    })
  })

  describe('environment', () => {
    test('falls back to a local environment when no CDP environment is configured', async () => {
      // ENVIRONMENT_NAME is fixed at module-load time, so the only way to observe the 'local'
      // fallback branch is to reset the module registry and re-import with the mock changed first.
      configGetMock.mockReturnValue(null)
      jest.resetModules()
      const { auditPlugin: freshAuditPlugin } =
        await import('../../../../app/graphql/plugins/audit.js')

      const publish = jest.fn()
      const plugin = freshAuditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ environment: 'local' }),
        baseContextValue.requestLogger
      )
    })
  })

  describe('correlationId', () => {
    test('is sourced from request.traceId', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        request: { ...baseContextValue.request, traceId: 'trace-xyz' },
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ correlationid: 'trace-xyz' }),
        baseContextValue.requestLogger
      )
    })
  })

  describe('datetime', () => {
    test('is sourced from request.info.received, not from when the event is built', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        request: {
          ...baseContextValue.request,
          info: {
            ...baseContextValue.request.info,
            received: Date.parse('2020-06-15T09:30:00.000Z')
          }
        },
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ datetime: '2020-06-15T09:30:00.000Z' }),
        baseContextValue.requestLogger
      )
    })
  })

  describe('accounts', () => {
    test('includes accounts recorded for the root selection', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: {
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }],
            accounts: { sbi: '123456789', frn: '6561479446' }
          }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({ accounts: { sbi: '123456789', frn: '6561479446' } })
        }),
        baseContextValue.requestLogger
      )
    })
    test('omits accounts entirely when nothing was recorded for the root selection', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      const [event] = publish.mock.calls[0]
      expect(event.audit.accounts).toBeUndefined()
      expect(JSON.parse(JSON.stringify(event)).audit).not.toHaveProperty('accounts')
    })
  })

  describe('requestBody', () => {
    test('is the JSON-stringified GraphQL request payload, not the raw request object', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      const [event] = publish.mock.calls[0]
      expect(event.audit.details.requestBody).toBe(JSON.stringify(requestPayload))
      // Guards against regressing to logging the raw request (headers/auth tokens, non-serialisable
      // Hapi internals) - see the requestBody field itself.
      expect(event.audit.details).not.toHaveProperty('headers')
      expect(() => JSON.stringify(event)).not.toThrow()
    })

    test('is undefined-stringified when the request has no payload', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        request: { ...baseContextValue.request, payload: undefined },
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            details: expect.objectContaining({ requestBody: undefined })
          })
        }),
        baseContextValue.requestLogger
      )
    })
  })

  describe('serviceAccount', () => {
    test('includes the recorded service account in details when present', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const auditTrail = fakeAuditTrail({
        business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
      })
      auditTrail.serviceAccount = jest.fn(() => 'service-account@example.com')
      const contextValue = { ...baseContextValue, auditTrail }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            details: expect.objectContaining({ serviceAccount: 'service-account@example.com' })
          })
        }),
        baseContextValue.requestLogger
      )
    })
  })

  describe('errors', () => {
    test('reports audit status as failure when the root selection has errors', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = {
        operationName: 'GetBusiness',
        contextValue,
        errors: [
          {
            message: 'Not found',
            path: ['business', 'payments'],
            extensions: { code: 'NOT_FOUND' }
          }
        ]
      }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({ status: 'failure' })
        }),
        baseContextValue.requestLogger
      )
    })
    test('attributes execution errors to the root selection they occurred under', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business1: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] },
          business2: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-2' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = {
        operationName: 'GetBoth',
        contextValue,
        errors: [
          {
            message: 'Not found',
            path: ['business2', 'payments'],
            extensions: { code: 'NOT_FOUND' }
          }
        ]
      }
      await listener.willSendResponse(requestContext)

      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            status: 'success',
            details: expect.objectContaining({ errorDetails: [] })
          })
        }),
        baseContextValue.requestLogger
      )
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: expect.objectContaining({
            status: 'failure',
            details: expect.objectContaining({
              errorDetails: [
                { message: 'Not found', path: ['business2', 'payments'], code: 'NOT_FOUND' }
              ]
            })
          })
        }),
        baseContextValue.requestLogger
      )
    })
    test('logs and swallows an error thrown by publish for one root selection, still publishing the others', async () => {
      const publish = jest
        .fn()
        .mockRejectedValueOnce(new Error('publish failed'))
        .mockResolvedValueOnce()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business1: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] },
          business2: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-2' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBoth', contextValue, errors: undefined }

      await expect(listener.willSendResponse(requestContext)).resolves.toBeUndefined()

      expect(publish).toHaveBeenCalledTimes(2)
      expect(baseContextValue.requestLogger.error).toHaveBeenCalledWith(
        '#DAL - audit event publish failed',
        expect.objectContaining({ error: expect.any(Error) })
      )
    })
    test('logs and swallows an error thrown while building/publishing events, without throwing', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const auditTrail = {
        rootKeys: jest.fn(() => {
          throw new Error('boom')
        })
      }
      const contextValue = { ...baseContextValue, auditTrail }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }

      await expect(listener.willSendResponse(requestContext)).resolves.toBeUndefined()
      expect(baseContextValue.requestLogger.error).toHaveBeenCalledWith(
        '#DAL - audit event build failed',
        expect.objectContaining({ error: expect.any(Error) })
      )
      expect(publish).not.toHaveBeenCalled()
    })
  })

  describe('default publish', () => {
    // Whether there's actually anywhere to publish to (SNS topic configured or not) is
    // sns-publisher.js's own decision (see test/unit/audit/sns-publisher.test.js) - this just
    // confirms auditPlugin() wires snsPublish in as the default when no publish override is given.
    test('uses snsPublish as the default publish implementation', async () => {
      const plugin = auditPlugin()

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: { entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }] }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      expect(snsPublishMock).toHaveBeenCalledTimes(1)
      const [event, requestLogger] = snsPublishMock.mock.calls[0]
      expect(event.audit.entities).toEqual([
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' }
      ])
      expect(requestLogger).toBe(baseContextValue.requestLogger)
    })
  })

  describe('schema conformance', () => {
    test('a built event with a recorded entity passes real @defra/fcp-audit-publisher schema validation', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = {
        ...baseContextValue,
        auditTrail: fakeAuditTrail({
          business: {
            entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }],
            accounts: { sbi: '123456789' }
          }
        })
      }
      const listener = await plugin.requestDidStart()
      const requestContext = { operationName: 'GetBusiness', contextValue, errors: undefined }
      await listener.willSendResponse(requestContext)

      const [event] = publish.mock.calls[0]
      expect(validateAuditEvent(event)).toMatchObject({ valid: true })
    })

    test('the synthetic audit/created fallback event also passes real schema validation', async () => {
      const publish = jest.fn()
      const plugin = auditPlugin({ publish })

      const contextValue = { ...baseContextValue, auditTrail: fakeAuditTrail() }
      const listener = await plugin.requestDidStart()
      const requestContext = {
        contextValue,
        errors: [
          { message: 'Syntax Error', path: undefined, extensions: { code: 'GRAPHQL_PARSE_FAILED' } }
        ]
      }
      await listener.willSendResponse(requestContext)

      const [event] = publish.mock.calls[0]
      expect(validateAuditEvent(event)).toMatchObject({ valid: true })
    })
  })
})
