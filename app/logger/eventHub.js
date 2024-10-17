import { EventHubProducerClient } from '@azure/event-hubs'
import * as Transport from 'winston-transport'

const producer = new EventHubProducerClient(
  process.env.EVENT_HUB_CONNECTION_STRING,
  process.env.EVENT_HUB_NAME
)

async function sendEvent (event) {
  const batch = await producer.createBatch()
  batch.tryAdd(event)
  await producer.sendBatch(batch)
  await producer.close()
}

export class EventHubTransport extends Transport {
  constructor (opts) {
    super(opts)
  }
  log (info, _callback) {
    sendEvent(info)
  }
}
