import { MongoDataSource } from 'apollo-datasource-mongodb'

export class MongoBusiness extends MongoDataSource {
  async getOrgIdBySbi(sbi) {
    const org = await this.collection.findOne({ _id: sbi })
    return org?.orgId
  }

  async insertOrgIdBySbi(sbi, orgId) {
    return this.collection.insertOne({
      _id: sbi,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}
