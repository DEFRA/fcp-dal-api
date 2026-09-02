import { createMetricsLogger, StorageResolution, Unit } from 'aws-embedded-metrics'
import { config } from '../../config.js'
import { DAL_HEALTH_CHECK_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

const STARTUP_METRIC_NAME = 'DAL start-up healthcheck'

export const healthCheck = async () => {
  if (config.get('nodeEnv') !== 'production') {
    return
  }

  try {
    const metricsLogger = createMetricsLogger()
    metricsLogger.putMetric(STARTUP_METRIC_NAME, 1, Unit.Count, StorageResolution.Standard)
    await metricsLogger.flush()
    logger.info(`SUCCESS: Published startup metric to CloudWatch: ${STARTUP_METRIC_NAME}`)
  } catch (error) {
    logger.error('#DAL - Error publishing startup metric', {
      error,
      code: DAL_HEALTH_CHECK_001
    })
    throw error
  }
}
