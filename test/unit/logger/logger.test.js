import ConsoleTransportInstance from 'winston-transport'
import { AWSMetricTransport } from '../../../app/logger/metricTransport.js'

describe('logger', () => {
  it('Single default log transport enabled', async () => {
    const { logger } = await import(`../../../app/logger/logger.js?version=${Date.now()}`)
    expect(logger.transports.length).toEqual(2)
    expect(logger.transports[0]).toBeInstanceOf(ConsoleTransportInstance)
    expect(logger.transports[1]).toBeInstanceOf(AWSMetricTransport)
  })
})
