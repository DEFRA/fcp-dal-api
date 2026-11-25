import { MongoClient } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../../app/config.js'
import { MongoBusiness } from '../../../../app/data-sources/mongo/Business.js'
import { MONGO_DB_ERROR_001 } from '../../../../app/logger/codes.js'

const client = new MongoClient(config.get('mongo.mongoUrl'))
client.connect()
const db = client.db(config.get('mongo.databaseName'))
const mockCollection = {
  ...db.collection('business'),
  findOne: vi.fn(),
  updateOne: vi.fn()
}
const logger = { warn: vi.fn() }
const mongoBusiness = new MongoBusiness({ modelOrCollection: mockCollection, logger })

describe('MongoBusiness', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('getOrgIdBySbi sbi doesnt exist', async () => {
    const result = await mongoBusiness.getOrgIdBySbi('823456789')
    expect(result).toBeUndefined()
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '823456789' })
  })

  it('getOrgIdBySbi sbi does exist', async () => {
    mockCollection.findOne.mockReturnValue({
      _id: '823456789',
      orgId: 'orgId'
    })
    const result = await mongoBusiness.getOrgIdBySbi('823456789')
    expect(result).toEqual('orgId')
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '823456789' })
  })

  describe('upsertMappingBySbi', () => {
    const dummyDate = new Date('2025-01-01')

    beforeEach(() => {
      vi.useFakeTimers().setSystemTime(dummyDate)
      mockCollection.updateOne.mockReset()
    })

    it('upserts the orgId', async () => {
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true, upsertedId: 'orgId' })

      const result = await mongoBusiness.upsertMappingBySbi('823456789', { orgId: 'orgId' })
      expect(result).toEqual({ acknowledged: true, upsertedId: 'orgId' })
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: '823456789' },
        {
          $set: { orgId: 'orgId', updatedAt: dummyDate },
          $setOnInsert: { createdAt: dummyDate }
        },
        { upsert: true }
      )
    })

    it('upserts the frn', async () => {
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true })

      const result = await mongoBusiness.upsertMappingBySbi('823456789', { frn: '9102658375' })
      expect(result).toEqual({ acknowledged: true })
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: '823456789' },
        {
          $set: { frn: '9102658375', updatedAt: dummyDate },
          $setOnInsert: { createdAt: dummyDate }
        },
        { upsert: true }
      )
    })

    it('upserts the orgId and frn in a single write', async () => {
      await mongoBusiness.upsertMappingBySbi('823456789', { orgId: 'orgId', frn: '9102658375' })
      expect(mockCollection.updateOne).toHaveBeenCalledTimes(1)
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: '823456789' },
        {
          $set: { orgId: 'orgId', frn: '9102658375', updatedAt: dummyDate },
          $setOnInsert: { createdAt: dummyDate }
        },
        { upsert: true }
      )
    })

    it('ignores fields other than orgId and frn', async () => {
      await mongoBusiness.upsertMappingBySbi('823456789', {
        orgId: 'orgId',
        _id: 'otherSbi',
        createdAt: new Date('2000-01-01'),
        orgID: 'typo'
      })
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: '823456789' },
        {
          $set: { orgId: 'orgId', updatedAt: dummyDate },
          $setOnInsert: { createdAt: dummyDate }
        },
        { upsert: true }
      )
    })

    it('skips empty values, so a partial mapping does not clear a cached value', async () => {
      await mongoBusiness.upsertMappingBySbi('823456789', { orgId: 'orgId', frn: undefined })
      expect(mockCollection.updateOne.mock.calls[0][1].$set).toEqual({
        orgId: 'orgId',
        updatedAt: dummyDate
      })
    })

    it.each([
      ['an empty mapping', {}],
      ['a mapping with only empty values', { orgId: null, frn: undefined }],
      ['an undefined mapping', undefined],
      ['a null mapping', null]
    ])('writes nothing for %s', async (_, mappings) => {
      const result = await mongoBusiness.upsertMappingBySbi('823456789', mappings)
      expect(result).toBeUndefined()
      expect(mockCollection.updateOne).not.toHaveBeenCalled()
    })
  })

  it('getFrnBySbi sbi doesnt exist', async () => {
    mockCollection.findOne.mockReturnValue(null)
    const result = await mongoBusiness.getFrnBySbi('823456789')
    expect(result).toBeUndefined()
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '823456789' })
  })

  it('getFrnBySbi sbi exists without a cached frn', async () => {
    mockCollection.findOne.mockReturnValue({ _id: '823456789', orgId: 'orgId' })
    const result = await mongoBusiness.getFrnBySbi('823456789')
    expect(result).toBeUndefined()
  })

  it('getFrnBySbi sbi does exist', async () => {
    mockCollection.findOne.mockReturnValue({ _id: '823456789', orgId: 'orgId', frn: '9102658375' })
    const result = await mongoBusiness.getFrnBySbi('823456789')
    expect(result).toEqual('9102658375')
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '823456789' })
  })

  describe('when mongo fails', () => {
    const error = new Error('mongo unavailable')

    beforeEach(() => {
      logger.warn.mockReset()
    })

    it.each([
      ['getOrgIdBySbi', 'orgId'],
      ['getFrnBySbi', 'frn']
    ])(
      '%s logs a warning and returns undefined, so the caller treats it as a miss',
      async (method, field) => {
        mockCollection.findOne.mockRejectedValueOnce(error)

        await expect(mongoBusiness[method]('823456789')).resolves.toBeUndefined()
        expect(logger.warn).toHaveBeenCalledWith(
          `#datasource - MongoBusiness - failed to read ${field} from MongoDB`,
          { sbi: '823456789', code: MONGO_DB_ERROR_001, error }
        )
      }
    )

    it('upsertMappingBySbi logs a warning and resolves undefined instead of throwing', async () => {
      mockCollection.updateOne.mockRejectedValueOnce(error)

      await expect(
        mongoBusiness.upsertMappingBySbi('823456789', { orgId: 'orgId' })
      ).resolves.toBeUndefined()
      expect(logger.warn).toHaveBeenCalledWith(
        '#datasource - MongoBusiness - failed to store mapping in MongoDB',
        { sbi: '823456789', code: MONGO_DB_ERROR_001, error }
      )
    })
  })

  describe('test concurrent writes', () => {
    const realCollection = db.collection('business-concurrency')
    const realMongoBusiness = new MongoBusiness({ modelOrCollection: realCollection, logger })

    it('upsertMappingBySbi handles two concurrent requests for the same SBI without failing', async () => {
      vi.useRealTimers()
      const sbi = '823456789'
      await realCollection.deleteMany({})

      await expect(
        Promise.all([
          realMongoBusiness.upsertMappingBySbi(sbi, { orgId: 'orgId' }),
          realMongoBusiness.upsertMappingBySbi(sbi, { orgId: 'orgId' })
        ])
      ).resolves.toHaveLength(2)

      expect(await realMongoBusiness.getOrgIdBySbi(sbi)).toEqual('orgId')
      expect(await realCollection.countDocuments({ _id: sbi })).toEqual(1)
    })

    it('upsertMappingBySbi adds the frn to an existing orgId document without overwriting it', async () => {
      vi.useRealTimers()
      const sbi = '823456789'
      await realCollection.deleteMany({})

      await realMongoBusiness.upsertMappingBySbi(sbi, { orgId: 'orgId' })
      const { createdAt } = await realCollection.findOne({ _id: sbi })
      await realMongoBusiness.upsertMappingBySbi(sbi, { frn: '9102658375' })

      const doc = await realCollection.findOne({ _id: sbi })
      expect(doc).toMatchObject({ _id: sbi, orgId: 'orgId', frn: '9102658375', createdAt })
      expect(await realCollection.countDocuments({ _id: sbi })).toEqual(1)
    })

    it('upsertMappingBySbi with nothing to write leaves an existing document untouched', async () => {
      vi.useRealTimers()
      const sbi = '823456789'
      await realCollection.deleteMany({})

      await realMongoBusiness.upsertMappingBySbi(sbi, { orgId: 'orgId' })
      const before = await realCollection.findOne({ _id: sbi })
      await realMongoBusiness.upsertMappingBySbi(sbi, { frn: undefined })

      expect(await realCollection.findOne({ _id: sbi })).toEqual(before)
    })
  })
})
