import { jest } from '@jest/globals'
import { DAL_AUDIT_VALIDATION_ERROR_001 } from '../../../app/logger/codes.js'

const mockSNSClient = jest.fn()
jest.unstable_mockModule('@aws-sdk/client-sns', () => ({
  SNSClient: mockSNSClient
}))

const mockValidateAuditEvent = jest.fn()
const mockPublishAuditEvent = jest.fn()
jest.unstable_mockModule('@defra/fcp-audit-publisher', () => ({
  validateAuditEvent: mockValidateAuditEvent,
  publishAuditEvent: mockPublishAuditEvent
}))

const mockConfigGet = jest.fn()
jest.unstable_mockModule('../../../app/config.js', () => ({
  config: { get: mockConfigGet }
}))

const TOPIC_ARN = 'arn:aws:sns:eu-west-2:000000000000:audit-topic'
mockConfigGet.mockReturnValue(TOPIC_ARN)
mockSNSClient.mockImplementation(() => ({ marker: 'sns-client-instance' }))

const { snsPublish } = await import('../../../app/audit/sns-publisher.js')

describe('sns-publisher', () => {
  let requestLogger

  beforeEach(() => {
    requestLogger = { error: jest.fn() }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('publishes a valid event via publishAuditEvent', async () => {
    mockValidateAuditEvent.mockReturnValue({ valid: true })
    mockPublishAuditEvent.mockResolvedValue({ messageId: 'message-1' })

    const event = { correlationid: 'trace-1', audit: { entities: [] } }
    await snsPublish(event, requestLogger)

    expect(mockValidateAuditEvent).toHaveBeenCalledWith(event)
    expect(mockPublishAuditEvent).toHaveBeenCalledWith(event, {
      snsClient: { marker: 'sns-client-instance' },
      sns: { topicArn: TOPIC_ARN }
    })
    expect(requestLogger.error).not.toHaveBeenCalled()
  })

  test('does not publish an invalid event, and logs only the validation errors - never the event body', async () => {
    mockValidateAuditEvent.mockReturnValue({
      valid: false,
      errors: ['"correlationid" is required']
    })

    const event = { user: 'someone@example.com', ip: '203.0.113.5' }
    await snsPublish(event, requestLogger)

    expect(mockPublishAuditEvent).not.toHaveBeenCalled()

    const [, loggedPayload] = requestLogger.error.mock.calls[0]
    expect(requestLogger.error).toHaveBeenCalledWith(
      '#DAL - audit event failed schema validation',
      {
        error: loggedPayload.error,
        code: DAL_AUDIT_VALIDATION_ERROR_001
      }
    )
    // The winston formatter (cdpSchemaTranslator) expects a single `error`, not a list.
    expect(loggedPayload.error).toBeInstanceOf(Error)
    expect(loggedPayload.error.message).toBe('"correlationid" is required')

    expect(JSON.stringify(loggedPayload)).not.toContain('someone@example.com')
    expect(JSON.stringify(loggedPayload)).not.toContain('203.0.113.5')
  })

  test('lets a publishAuditEvent rejection propagate, rather than swallowing it here', async () => {
    mockValidateAuditEvent.mockReturnValue({ valid: true })
    mockPublishAuditEvent.mockRejectedValue(new Error('SNS publish failed'))

    const event = { correlationid: 'trace-1', audit: { entities: [] } }

    await expect(snsPublish(event, requestLogger)).rejects.toThrow('SNS publish failed')
    expect(requestLogger.error).not.toHaveBeenCalled()
  })

  describe('with no SNS topic configured', () => {
    // topicArn is captured once at module-load time (see sns-publisher.js), so exercising the
    // "unconfigured" branch means resetting the module registry and re-importing with the config
    // mock changed first, same approach as ENVIRONMENT_NAME in audit.test.js.
    let unconfiguredSnsPublish

    beforeEach(async () => {
      mockConfigGet.mockReturnValue(null)
      jest.resetModules()
      const imported = await import('../../../app/audit/sns-publisher.js')
      unconfiguredSnsPublish = imported.snsPublish
      mockConfigGet.mockReturnValue(TOPIC_ARN)
    })

    test('still validates, and still logs a validation failure, even though nothing will be published', async () => {
      mockValidateAuditEvent.mockReturnValue({
        valid: false,
        errors: ['"correlationid" is required']
      })

      const event = { user: 'someone@example.com' }
      await unconfiguredSnsPublish(event, requestLogger)

      expect(mockValidateAuditEvent).toHaveBeenCalledWith(event)
      expect(requestLogger.error).toHaveBeenCalledWith(
        '#DAL - audit event failed schema validation',
        {
          error: expect.objectContaining({ message: '"correlationid" is required' }),
          code: DAL_AUDIT_VALIDATION_ERROR_001
        }
      )
      expect(mockPublishAuditEvent).not.toHaveBeenCalled()
    })

    test('validates a valid event but does not publish or log anything else', async () => {
      mockValidateAuditEvent.mockReturnValue({ valid: true })

      const event = { correlationid: 'trace-1', audit: { entities: [] } }
      await unconfiguredSnsPublish(event, requestLogger)

      expect(mockValidateAuditEvent).toHaveBeenCalledWith(event)
      expect(mockPublishAuditEvent).not.toHaveBeenCalled()
      expect(requestLogger.error).not.toHaveBeenCalled()
    })
  })
})
