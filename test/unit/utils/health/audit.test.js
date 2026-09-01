import { expect, jest } from '@jest/globals'
import { DAL_HEALTH_CHECK_001 } from '../../../../app/logger/codes.js'

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

const mockSnsPublish = jest.fn()

jest.unstable_mockModule('../../../../app/logger/logger.js', () => ({ logger: mockLogger }))
jest.unstable_mockModule('../../../../app/audit/sns-publisher.js', () => ({
  snsPublish: mockSnsPublish
}))

const { healthCheck } = await import('../../../../app/utils/health/audit.js')

describe('audit startup health check', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('publishes a dummy audit event when SNS is configured', async () => {
    const configGet = jest.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => {
      if (key === 'audit.sns.topicArn')
        return 'arn:aws:sns:eu-west-2:000000000000:startup-audit-topic'
      if (key === 'cdp.env') return null
      return null
    })

    mockSnsPublish.mockResolvedValue({ messageId: 'startup-1' })

    await healthCheck()

    expect(mockSnsPublish).toHaveBeenCalledTimes(1)
    const [event, logger] = mockSnsPublish.mock.calls[0]
    expect(logger).toBe(mockLogger)
    expect(event.user).toBe('DAL start-up healthcheck')
    expect(event.audit.entities).toEqual([
      { entity: 'audit', action: 'created', entityid: 'DAL start-up healthcheck' }
    ])
    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: Published startup audit event to SNS')
  })

  it('sets a cdp-prefixed environment when cdp.env is configured', async () => {
    const configGet = jest.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => {
      if (key === 'audit.sns.topicArn')
        return 'arn:aws:sns:eu-west-2:000000000000:startup-audit-topic'
      if (key === 'cdp.env') return 'dev'
      return null
    })

    mockSnsPublish.mockResolvedValue({ messageId: 'startup-2' })

    await healthCheck()

    const [event] = mockSnsPublish.mock.calls[0]
    expect(event.environment).toBe('cdp-dev')
  })

  it('skips publication when no SNS topic is configured', async () => {
    const configGet = jest.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => {
      if (key === 'audit.sns.topicArn') return null
      return null
    })

    await healthCheck()

    expect(mockSnsPublish).not.toHaveBeenCalled()
    expect(mockLogger.info).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('logs and rethrows when SNS publishing fails', async () => {
    const configGet = jest.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => {
      if (key === 'audit.sns.topicArn')
        return 'arn:aws:sns:eu-west-2:000000000000:startup-audit-topic'
      if (key === 'cdp.env') return null
      return null
    })

    const error = new Error('SNS publish failed')
    mockSnsPublish.mockRejectedValue(error)

    await expect(healthCheck()).rejects.toThrow('SNS publish failed')

    expect(mockLogger.error).toHaveBeenCalledWith('#DAL - Error publishing startup audit event', {
      error,
      code: DAL_HEALTH_CHECK_001
    })
  })
})
