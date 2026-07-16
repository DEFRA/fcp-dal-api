import { config } from '../../config.js'
import { MONGO_DB_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { mongoClient } from '../../mongo.js'

export const healthCheck = async () => {
  try {
    logger.info(`Connecting to MongoDB on ${config.get('mongo.mongoUrl')}`)
    await mongoClient.connect()
    logger.info('SUCCESS: Connected to MongoDB')
  } catch (err) {
    logger.error('#DAL - Error connecting to MongoDB', { error: err, code: MONGO_DB_ERROR_001 })
    throw err
  }
}
