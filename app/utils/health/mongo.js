import { config } from '../../config.js'
import { MONGO_DB_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { ensureTtlIndexes, mongoClient } from '../../mongo.js'

export const healthCheck = async () => {
  try {
    logger.info(`Connecting to MongoDB on ${config.get('mongo.mongoUrl')}`)
    await mongoClient.connect()
    logger.info('SUCCESS: Connected to MongoDB')
    await ensureTtlIndexes()
    logger.info('SUCCESS: Ensured MongoDB cache TTL indexes')
  } catch (err) {
    logger.error('#DAL - Error connecting to MongoDB', { error: err, code: MONGO_DB_ERROR_001 })
    throw err
  }
}
