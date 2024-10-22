import ConsoleTransportInstance from 'winston-transport'
import { AzureEventHubTransport } from '../../app/logger/AzureEventHubTransport.js'

describe('logger', () => {
  it('Single default log transport enabled', async () => {
    process.env.EVENT_HUB_DISABLED = 'true'
    process.env.APPINSIGHTS_CONNECTIONSTRING = undefined
    const { logger } = await import(
      `../../app/logger/logger.js?version=${Date.now()}`
    )
    expect(logger.transports.length).toEqual(1)
    expect(logger.transports[0]).toBeInstanceOf(ConsoleTransportInstance)
  })

  it('Two log transport enabled including AzureEventHubTransport', async () => {
    process.env.EVENT_HUB_DISABLED = 'false'
    const { logger } = await import(
      `../../app/logger/logger.js?version=${Date.now()}`
    )
    expect(logger.transports.length).toEqual(2)
    expect(logger.transports[0]).toBeInstanceOf(ConsoleTransportInstance)
    expect(logger.transports[1]).toBeInstanceOf(AzureEventHubTransport)
  })
})
