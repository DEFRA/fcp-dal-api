import { MongoMemoryServer } from 'mongodb-memory-server'

export default async function setup() {
  const mongo = await MongoMemoryServer.create()
  process.env.MONGO_URL = mongo.getUri()

  return async () => {
    await mongo.stop()
  }
}
