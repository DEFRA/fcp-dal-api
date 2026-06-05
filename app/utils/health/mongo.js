import { MONGO_DB_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { mongoClient } from '../../mongo.js'

export const healthCheck = async () => {
  try {
    await mongoClient.connect()
    logger.info('Connected to MongoDB')
  } catch (err) {
    logger.error('#DAL - Error connecting to MongoDB', { error: err, code: MONGO_DB_ERROR_001 })
    process.exit(1)
  }
}
