import { createMetricsLogger, StorageResolution, Unit } from 'aws-embedded-metrics'
import { DAL_METRICS_ERROR_001 } from './codes.js'
import { logger } from './logger.js'

export async function sendMetric(
  metricName,
  value = 1,
  unit = Unit.Count,
  dimensions = {},
  storageResolution = StorageResolution.Standard
) {
  try {
    const metricsLogger = createMetricsLogger()
    if (Object.keys(dimensions).length > 0) {
      metricsLogger.setDimensions(dimensions)
    }
    metricsLogger.putMetric(metricName, value, unit, storageResolution)
    await metricsLogger.flush()
  } catch (error) {
    logger.error('#DAL - failed to send metric', { error, code: DAL_METRICS_ERROR_001 })
  }
}
