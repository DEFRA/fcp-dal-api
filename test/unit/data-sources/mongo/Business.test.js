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
  insertOne: jest.fn()
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

  it('insertOrgIdBySbi', async () => {
    const dummyDate = new Date('2025-01-01')
    jest.useFakeTimers().setSystemTime(dummyDate)
    mockCollection.insertOne.mockResolvedValue({ acknowledged: true, _id: 'orgId' })

    const result = await mongoBusiness.insertOrgIdBySbi('1234567890', 'orgId')
    expect(result).toEqual({ acknowledged: true, _id: 'orgId' })
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      _id: '1234567890',
      orgId: 'orgId',
      createdAt: dummyDate,
      updatedAt: dummyDate
    })
  })
})
