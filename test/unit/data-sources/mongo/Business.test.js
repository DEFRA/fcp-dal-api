import { afterAll, beforeAll, expect, jest } from '@jest/globals'
import { MongoClient } from 'mongodb'
import { config } from '../../../../app/config.js'
import { MongoBusiness } from '../../../../app/data-sources/mongo/Business.js'

const client = new MongoClient(config.get('mongo.mongoUrl'))
client.connect()
const db = client.db(config.get('mongo.databaseName'))
const mockCollection = {
  ...db.collection('business'),
  findOne: jest.fn(),
  updateOne: jest.fn()
}
const mongoBusiness = new MongoBusiness({ modelOrCollection: mockCollection })

describe('MongoBusiness', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('getOrgIdBySbi sbi doesnt exist', async () => {
    const result = await mongoBusiness.getOrgIdBySbi('1234567890')
    expect(result).toBeUndefined()
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '1234567890' })
  })

  it('getOrgIdBySbi sbi does exist', async () => {
    mockCollection.findOne.mockReturnValue({
      _id: '1234567890',
      orgId: 'orgId'
    })
    const result = await mongoBusiness.getOrgIdBySbi('1234567890')
    expect(result).toEqual('orgId')
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '1234567890' })
  })

  it('upsertOrgIdBySbi', async () => {
    const dummyDate = new Date('2025-01-01')
    jest.useFakeTimers().setSystemTime(dummyDate)
    mockCollection.updateOne.mockResolvedValue({ acknowledged: true, upsertedId: 'orgId' })

    const result = await mongoBusiness.upsertOrgIdBySbi('1234567890', 'orgId')
    expect(result).toEqual({ acknowledged: true, upsertedId: 'orgId' })
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { _id: '1234567890' },
      {
        $set: { orgId: 'orgId', updatedAt: dummyDate },
        $setOnInsert: { createdAt: dummyDate }
      },
      { upsert: true }
    )
  })

  describe('test concurrent writes', () => {
    const realCollection = db.collection('business-concurrency')
    const realMongoBusiness = new MongoBusiness({ modelOrCollection: realCollection })

    it('upsertOrgIdBySbi handles two concurrent requests for the same SBI without failing', async () => {
      jest.useRealTimers()
      const sbi = '1234567890'
      await realCollection.deleteMany({})

      await expect(
        Promise.all([
          realMongoBusiness.upsertOrgIdBySbi(sbi, 'orgId'),
          realMongoBusiness.upsertOrgIdBySbi(sbi, 'orgId')
        ])
      ).resolves.toHaveLength(2)

      expect(await realMongoBusiness.getOrgIdBySbi(sbi)).toEqual('orgId')
      expect(await realCollection.countDocuments({ _id: sbi })).toEqual(1)
    })
  })
})
