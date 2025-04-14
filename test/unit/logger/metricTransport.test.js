import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Unit } from 'aws-embedded-metrics'
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam'
import { AWSMetricTransport } from '../../../app/logger/metricTransport'

describe('#AWSMetricTransport', () => {
  let transport

  beforeEach(() => {
    transport = new AWSMetricTransport({})
  })

  it('should create metrics logger', () => {
    expect(transport.metrics).toBeDefined()
  })

  describe('parseMetric', () => {
    it('should parse metric', () => {
      const metric = transport.parseMetric({
        level: 'metric',
        message: 'ResponseTime',
        [SPLAT]: [129],
        [LEVEL]: 'metric',
        [MESSAGE]: 'Some message'
      })

      expect(metric).toEqual({
        metricName: 'ResponseTime',
        metricValue: 129,
        metricUnit: Unit.Count,
        dimensions: {}
      })
    })

    it('should parse metric with metric unit', () => {
      const metric = transport.parseMetric({
        level: 'metric',
        message: 'ResponseTime',
        [SPLAT]: [129, Unit.Milliseconds]
      })

      expect(metric).toEqual({
        metricName: 'ResponseTime',
        metricValue: 129,
        metricUnit: Unit.Milliseconds,
        dimensions: {}
      })
    })

    it('should parse metric with metric unit and dimensions', () => {
      const metric = transport.parseMetric({
        level: 'metric',
        message: 'ResponseTime',
        [SPLAT]: [129, Unit.Milliseconds, { foo: 'bar' }]
      })

      expect(metric).toEqual({
        metricName: 'ResponseTime',
        metricValue: 129,
        metricUnit: Unit.Milliseconds,
        dimensions: { foo: 'bar' }
      })
    })
    it('should throw an error if the metric name is not provided', () => {
      expect(() => transport.parseMetric({})).toThrow(
        'Metric name is required and must be a string'
      )
    })

    it('should throw an error if the level is not metric', () => {
      expect(() => transport.parseMetric({ level: 'info', message: 'ResponseTime' })).toThrow(
        'Only metric level logs are supported in this transport'
      )
    })

    it('should throw an error if the metric name is not a string', () => {
      expect(() => transport.parseMetric({ level: 'metric', message: 123 })).toThrow(
        'Metric name is required and must be a string'
      )
    })

    it('should throw an error if the metric value is not a number', () => {
      expect(() => {
        const metricValue = 'not a number'
        transport.parseMetric({
          level: 'metric',
          message: 'ResponseTime',
          [SPLAT]: [metricValue]
        })
      }).toThrow('Metric value must be a number')
    })

    it('should throw an error if metric unit is not a valid unit', () => {
      expect(() => {
        const metricValue = 129
        const metricUnit = 'not a valid unit'

        transport.parseMetric({
          level: 'metric',
          message: 'ResponseTime',
          [SPLAT]: [metricValue, metricUnit],
          [LEVEL]: 'metric',
          [MESSAGE]: 'Some message'
        })
      }).toThrow('Metric unit must be a valid unit')
    })

    it('should throw an error if dimensions is not an object', () => {
      expect(() => {
        const metricValue = 129
        const dimensions = [1, 2, 3]

        transport.parseMetric({
          level: 'metric',
          message: 'ResponseTime',
          [SPLAT]: [metricValue, dimensions],
          [LEVEL]: 'metric',
          [MESSAGE]: 'Some message'
        })
      }).toThrow('Dimensions must be an object')
    })
  })

  describe('sendMetric', () => {
    beforeEach(() => {
      jest.spyOn(transport.metrics, 'putMetric')
      jest.spyOn(transport.metrics, 'setDimensions')
    })

    it('should send metric with dimensions', () => {
      transport.sendMetric({
        metricName: 'ResponseTime',
        metricValue: 129,
        metricUnit: Unit.Milliseconds,
        dimensions: { foo: 'bar' }
      })

      expect(transport.metrics.putMetric).toHaveBeenCalledWith(
        'ResponseTime',
        129,
        Unit.Milliseconds
      )
      expect(transport.metrics.setDimensions).toHaveBeenCalledWith({ foo: 'bar' })
    })

    it('should send metric without dimensions', () => {
      transport.sendMetric({
        metricName: 'ResponseTime',
        metricValue: 129,
        metricUnit: Unit.Milliseconds,
        dimensions: {}
      })

      expect(transport.metrics.putMetric).toHaveBeenCalledWith(
        'ResponseTime',
        129,
        Unit.Milliseconds
      )
      expect(transport.metrics.setDimensions).not.toHaveBeenCalled()
    })
  })

  describe('log', () => {
    beforeEach(() => {
      jest.spyOn(transport.metrics, 'putMetric')
      jest.spyOn(transport.metrics, 'setDimensions')
    })

    it('should send metric', () => {
      const callback = jest.fn()
      transport.log(
        {
          level: 'metric',
          message: 'ResponseTime',
          [SPLAT]: [129, Unit.Milliseconds, { foo: 'bar' }]
        },
        callback
      )

      expect(transport.metrics.putMetric).toHaveBeenCalledWith(
        'ResponseTime',
        129,
        Unit.Milliseconds
      )
      expect(transport.metrics.setDimensions).toHaveBeenCalledWith({ foo: 'bar' })
      expect(callback).toHaveBeenCalled()
    })

    it('should not send metric if level is not metric', () => {
      const callback = jest.fn()
      transport.log({ level: 'info' }, callback)

      expect(transport.metrics.putMetric).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
    })

    it('should emit error if metric parsing fails', () => {
      const callback = jest.fn()

      expect(() => {
        transport.log(
          { level: 'metric', message: 'ResponseTime', [SPLAT]: ['not a number'] },
          callback
        )
      }).toThrow('Metric value must be a number')

      expect(transport.metrics.putMetric).not.toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
    })
  })
})
