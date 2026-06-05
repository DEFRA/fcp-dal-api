import { expect, jest } from '@jest/globals'
import { mongoClient } from '../../../../app/mongo.js'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

jest.unstable_mockModule('../../../../app/logger/logger.js', () => mockLogger)

const { healthCheck } = await import('../../../../app/utils/health/mongo.js')

describe('Mongo health check', () => {
  beforeEach(() => {
    jest.spyOn(mongoClient, 'connect').mockResolvedValue()
    jest.spyOn(process, 'exit').mockReturnValue(1)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should log success when MongoDB connects', async () => {
    await healthCheck()

    expect(mongoClient.connect).toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith('Connected to MongoDB')
  })

  it('should log error and exit when MongoDB fails to connect', async () => {
    const mockError = new Error('MongoDB connection failed')
    mongoClient.connect.mockRejectedValueOnce(mockError)

    await healthCheck()

    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error connecting to MongoDB', {
      error: mockError,
      code: expect.any(String)
    })
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
