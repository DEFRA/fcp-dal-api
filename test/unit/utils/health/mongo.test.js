import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, mongoClient } from '../../../../app/mongo.js'

const mockLogger = {
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}

vi.doMock('../../../../app/logger/logger.js', () => mockLogger)

const { healthCheck } = await import('../../../../app/utils/health/mongo.js')

describe('Mongo health check', () => {
  let createIndex

  beforeEach(() => {
    createIndex = vi.fn().mockResolvedValue('updatedAt_ttl')
    vi.spyOn(mongoClient, 'connect').mockResolvedValue()
    vi.spyOn(db, 'collection').mockReturnValue({ createIndex })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log success when MongoDB connects and ensure TTL indexes', async () => {
    await healthCheck()

    expect(mongoClient.connect).toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith('SUCCESS: Connected to MongoDB')
    expect(db.collection).toHaveBeenCalledWith('customers')
    expect(db.collection).toHaveBeenCalledWith('businesses')
    expect(createIndex).toHaveBeenCalledTimes(2)
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: Ensured MongoDB cache TTL indexes'
    )
  })

  it('should log error and throw when MongoDB fails to connect', async () => {
    const mockError = new Error('MongoDB connection failed')
    mongoClient.connect.mockRejectedValueOnce(mockError)

    await expect(healthCheck()).rejects.toThrow('MongoDB connection failed')

    expect(createIndex).not.toHaveBeenCalled()
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error connecting to MongoDB', {
      error: mockError,
      code: expect.any(String)
    })
  })

  it('should log error and throw when TTL index creation fails', async () => {
    const mockError = new Error('createIndex failed')
    createIndex.mockRejectedValue(mockError)

    await expect(healthCheck()).rejects.toThrow('createIndex failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error connecting to MongoDB', {
      error: mockError,
      code: expect.any(String)
    })
  })
})
