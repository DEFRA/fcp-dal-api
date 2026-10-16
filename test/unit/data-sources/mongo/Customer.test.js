import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MongoClient } from 'mongodb'
import { config } from '../../../../app/config.js'
import { MongoCustomer } from '../../../../app/data-sources/mongo/Customer.js'

const client = new MongoClient(config.get('mongo.mongoUrl'))
client.connect()
const db = client.db(config.get('mongo.databaseName'))
const mockCollection = {
  ...db.collection('customer'),
  findOne: vi.fn(),
  updateOne: vi.fn()
}

const mongoCustomer = new MongoCustomer({ modelOrCollection: mockCollection })

describe('MongoCustomer', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('getPersonIdByCRN', () => {
    it('when no matching record exists', async () => {
      const result = await mongoCustomer.findPersonIdByCRN('1234567890')
      expect(result).toBeUndefined()
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '1234567890' })
    })

    it('when a matching record already exists', async () => {
      mockCollection.findOne.mockReturnValue({
        _id: '1234567890',
        personId: 'personId'
      })
      const result = await mongoCustomer.findPersonIdByCRN('1234567890')
      expect(result).toEqual('personId')
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '1234567890' })
    })
  })

  describe('upsertPersonIdByCRN', () => {
    it('upsert a new record with CRN as the main record key', async () => {
      const dummyDate = new Date('2025-01-01')
      vi.useFakeTimers().setSystemTime(dummyDate)
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true, upsertedId: 'personId' })

      const result = await mongoCustomer.upsertPersonIdByCRN('1234567890', 'personId')
      expect(result).toEqual({ acknowledged: true, upsertedId: 'personId' })
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: '1234567890' },
        {
          $set: { personId: 'personId', updatedAt: dummyDate },
          $setOnInsert: { createdAt: dummyDate }
        },
        { upsert: true }
      )
    })
  })

  describe('test concurrent writes', () => {
    const realCollection = db.collection('customer-concurrency')
    const realMongoCustomer = new MongoCustomer({ modelOrCollection: realCollection })

    it('upsertPersonIdByCRN handles two concurrent requests for the same CRN without failing', async () => {
      vi.useRealTimers()
      const crn = '0987654321'
      await realCollection.deleteMany({})

      await expect(
        Promise.all([
          realMongoCustomer.upsertPersonIdByCRN(crn, 'personId'),
          realMongoCustomer.upsertPersonIdByCRN(crn, 'personId')
        ])
      ).resolves.toHaveLength(2)

      expect(await realMongoCustomer.findPersonIdByCRN(crn)).toEqual('personId')
      expect(await realCollection.countDocuments({ _id: crn })).toEqual(1)
    })
  })
})
