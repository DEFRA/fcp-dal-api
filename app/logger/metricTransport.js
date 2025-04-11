import { createMetricsLogger, Unit } from 'aws-embedded-metrics'
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam'
import Transport from 'winston-transport'

export class AWSMetricTransport extends Transport {
  constructor(options) {
    super(options)
    this.metrics = createMetricsLogger()
  }

  parseMetric(info) {
    const {
      message,
      level,
      [SPLAT]: logArguments,
      [LEVEL]: _level, // eslint-disable-line no-unused-vars
      [MESSAGE]: _message, // eslint-disable-line no-unused-vars
      ...additionalDimensions
    } = info

    if (!message || typeof message !== 'string') {
      throw new Error('Metric name is required and must be a string')
    }

    if (!level || level !== 'metric') {
      throw new Error(`Only metric level logs are supported in this transport. Received: ${level}`)
    }

    const metricValue = logArguments[0]
    let metricUnit = Unit.Count
    let dimensions = {}

    switch (logArguments.length) {
      case 3:
        metricUnit = logArguments[1]
        dimensions = logArguments[2]
        break
      case 2:
        if (typeof logArguments[1] === 'string') {
          metricUnit = logArguments[1]
        } else {
          dimensions = logArguments[1]
        }
        break
      case 1:
        // No unit or dimensions provided
        break
      default:
        throw new Error('Invalid number of arguments')
    }

    // check if metricValue is an number
    if (metricValue === undefined || typeof metricValue !== 'number') {
      throw new Error('Metric value must be a number')
    }

    if (!metricUnit || !Object.values(Unit).includes(metricUnit)) {
      throw new Error('Metric unit must be a valid unit')
    }

    // check if dimensions is an object
    if (!dimensions || Object.prototype.toString.call(dimensions) !== '[object Object]') {
      throw new Error('Dimensions must be an object')
    }

    return {
      metricName: message,
      metricValue,
      metricUnit,
      dimensions: {
        ...dimensions,
        ...additionalDimensions
      }
    }
  }

  sendMetric(metric) {
    const { metricName, metricValue, metricUnit, dimensions } = metric

    this.metrics.putMetric(metricName, metricValue, metricUnit)

    if (Object.keys(dimensions).length > 0) {
      this.metrics.setDimensions(dimensions)
    }
  }

  log(info, callback) {
    if (info.level !== 'metric') {
      return callback()
    }

    setImmediate(() => {
      this.emit('logged', info)
    })

    const metric = this.parseMetric(info)
    this.sendMetric(metric)

    callback()
  }
}
