import { MongoClient } from 'mongodb'
import { config } from './config.js'
import { logger } from './logger/logger.js'

const mongoTimeout = config.get('mongo.mongoOptions.timeoutMS')
export const mongoClient = new MongoClient(config.get('mongo.mongoUrl'), {
  retryWrites: config.get('mongo.mongoOptions.retryWrites'),
  readPreference: config.get('mongo.mongoOptions.readPreference'),
  timeoutMS: mongoTimeout,
  serverSelectionTimeoutMS: mongoTimeout,
  connectTimeoutMS: mongoTimeout
})

export const db = mongoClient.db(config.get('mongo.databaseName'))

export const CACHE_COLLECTIONS = ['customers', 'businesses']
const TTL_INDEX_NAME = 'updatedAt_ttl'
// MongoDB error codes raised when an index of the same name/key exists with different options
const INDEX_CONFLICT_CODES = new Set([85, 86])

/**
 * Ensures a TTL index on `updatedAt` exists for the given collection, expiring documents
 * after `mongo.cacheTtlSeconds.<collectionName>`. If the index already exists with a
 * different TTL, it is updated in place via collMod.
 */
const ensureTtlIndex = async (collectionName) => {
  const expireAfterSeconds = config.get(`mongo.cacheTtlSeconds.${collectionName}`)
  try {
    await db
      .collection(collectionName)
      .createIndex({ updatedAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds })
  } catch (err) {
    if (!INDEX_CONFLICT_CODES.has(err?.code)) {
      throw err
    }
    logger.info(`Updating TTL index for collection: ${collectionName}`)
    await db.command({
      collMod: collectionName,
      index: { name: TTL_INDEX_NAME, expireAfterSeconds }
    })
  }
}

/**
 * Ensures TTL indexes exist for each cache collection, so cached CRN -> personId and
 * SBI -> orgId mappings expire.
 */
export const ensureTtlIndexes = () => Promise.all(CACHE_COLLECTIONS.map(ensureTtlIndex))
