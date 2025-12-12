import { MongoClient } from 'mongodb'
import { config } from './config.js'

const mongoTimeout = config.get('mongo.mongoOptions.timeoutMS')
export const mongoClient = new MongoClient(config.get('mongo.mongoUrl'), {
  retryWrites: config.get('mongo.mongoOptions.retryWrites'),
  readPreference: config.get('mongo.mongoOptions.readPreference'),
  timeoutMS: mongoTimeout,
  serverSelectionTimeoutMS: mongoTimeout,
  connectTimeoutMS: mongoTimeout
})

export const db = mongoClient.db(config.get('mongo.databaseName'))
