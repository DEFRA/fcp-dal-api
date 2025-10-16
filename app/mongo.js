import { MongoClient } from 'mongodb'
import tls from 'node:tls'
import { config } from './config.js'

export const mongoClient = new MongoClient(config.get('mongo.mongoUrl'), {
  retryWrites: config.get('mongo.mongoOptions.retryWrites'),
  readPreference: config.get('mongo.mongoOptions.readPreference'),
  secureContext: tls.createSecureContext()
})
export const db = mongoClient.db(config.get('mongo.databaseName'))
