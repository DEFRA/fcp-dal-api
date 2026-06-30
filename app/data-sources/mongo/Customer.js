import { MongoDataSource } from 'apollo-datasource-mongodb'

export class MongoCustomer extends MongoDataSource {
  async findPersonIdByCRN(crn) {
    const customer = await this.collection.findOne({ _id: crn })
    return customer?.personId
  }

  async upsertPersonIdByCRN(crn, personId) {
    const now = new Date()
    return this.collection.updateOne(
      { _id: crn },
      {
        $set: { personId, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    )
  }
}
