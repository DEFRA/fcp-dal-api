import { MongoDataSource } from 'apollo-datasource-mongodb'

export class MongoCustomer extends MongoDataSource {
  async getPersonIdByCRN(crn) {
    const customer = await this.collection.findOne({ _id: crn })
    return customer?.personId
  }

  async insertPersonIdByCRN(crn, personId) {
    return this.collection.insertOne({
      _id: crn,
      personId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}
