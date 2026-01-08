import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { MongoClient } from 'mongodb'
import { config } from '../../../../app/config.js'
import { MongoCustomer } from '../../../../app/data-sources/mongo/Customer.js'

const client = new MongoClient(config.get('mongo.mongoUrl'))
client.connect()
const db = client.db(config.get('mongo.databaseName'))
const mockCollection = {
  ...db.collection('customer'),
  findOne: jest.fn(),
  insertOne: jest.fn()
}

const mongoCustomer = new MongoCustomer({ modelOrCollection: mockCollection })

describe('MongoCustomer', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
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

  describe('insertPersonIdByCRN', () => {
    it('inserts a new record with CRN as the main record key', async () => {
      const dummyDate = new Date('2025-01-01')
      jest.useFakeTimers().setSystemTime(dummyDate)
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true, _id: 'personId' })

      const result = await mongoCustomer.insertPersonIdByCRN('1234567890', 'personId')
      expect(result).toEqual({ acknowledged: true, _id: 'personId' })
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        _id: '1234567890',
        personId: 'personId',
        createdAt: dummyDate,
        updatedAt: dummyDate
      })
    })
  })
})
