import { MongoDataSource } from 'apollo-datasource-mongodb'

export class MongoBusiness extends MongoDataSource {
  async getOrgIdBySbi(sbi) {
    const org = await this.collection.findOne({ _id: sbi })
    return org?.orgId
  }

  async upsertOrgIdBySbi(sbi, orgId) {
    const now = new Date()
    return this.collection.updateOne(
      { _id: sbi },
      {
        $set: { orgId, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    )
  }
}
