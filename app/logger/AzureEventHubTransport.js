import { EventHubProducerClient } from '@azure/event-hubs'
import TransportStream from 'winston-transport'
import {
  DAL_APPLICATION_REQUEST_001,
  DAL_REQUEST_AUTHENTICATION_001
} from './codes'

export class AzureEventHubTransport extends TransportStream {
  constructor (options) {
    super(options)
    this.connectionString = options.connectionString
    this.eventHubName = options.eventHubName
    this.producerClient = new EventHubProducerClient(
      this.connectionString,
      this.eventHubName
    )
    this.event_hub_enabled_codes = [
      DAL_APPLICATION_REQUEST_001,
      DAL_REQUEST_AUTHENTICATION_001
    ]
  }

  log (info, callback) {
    // We only want to send certain events to SOC, also need ot ensure no PII
    if (this.event_hub_enabled_codes.includes(info.message.code)) {
      setImmediate(() => this.emit('logged', info))

      const logEntry = {
        application: process.env.SOC_APPPLICATION_IDENTIFIER,
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
