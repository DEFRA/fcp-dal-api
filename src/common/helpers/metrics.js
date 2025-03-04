import {
  createMetricsLogger,
  Unit,
  StorageResolution
} from 'aws-embedded-metrics'
import { config } from '../../config.js'
import { createLogger } from './logging/logger.js'

const metricsCounter = async (metricName, value = 1) => {
  const isMetricsEnabled = config.get('isMetricsEnabled')

  if (!isMetricsEnabled) {
    return
  }

  try {
    const metricsLogger = createMetricsLogger()
    metricsLogger.putMetric(
      metricName,
      value,
      Unit.Count,
      StorageResolution.Standard
    )
    await metricsLogger.flush()
  } catch (error) {
    createLogger().error(error, error.message)
  }
}

export { metricsCounter }
