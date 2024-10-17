import { EventHubProducerClient } from '@azure/event-hubs'
import TransportStream from 'winston-transport'

export class AzureEventHubTransport extends TransportStream {
  constructor (options) {
    super(options)
    this.connectionString = options.connectionString
    this.eventHubName = options.eventHubName
    this.producerClient = new EventHubProducerClient(
      this.connectionString,
      this.eventHubName
    )
  }

  log (info, callback) {
    setImmediate(() => this.emit('logged', info))

    const logEntry = {
      message: info.message,
      level: info.level,
      timestamp: new Date().toISOString(),
      ...info
    }

    this.sendToEventHub(logEntry).catch(err => {
      console.error('Error sending log to Event Hub:', err)
    })

    callback()
  }

  async sendToEventHub (logEntry) {
    const batch = await this.producerClient.createBatch()
    batch.tryAdd({ body: logEntry })

    await this.producerClient.sendBatch(batch)
  }

  close () {
    return this.producerClient.close()
  }
}
