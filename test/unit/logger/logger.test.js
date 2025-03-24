import ConsoleTransportInstance from 'winston-transport'

describe('logger', () => {
  it('Single default log transport enabled', async () => {
    const { logger } = await import(`../../../app/logger/logger.js?version=${Date.now()}`)
    expect(logger.transports.length).toEqual(1)
    expect(logger.transports[0]).toBeInstanceOf(ConsoleTransportInstance)
  })
})
