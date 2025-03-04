import { MongoClient } from 'mongodb'
import { LockManager } from 'mongo-locks'

import { config } from '../../config.js'

export const mongoDb = {
  plugin: {
    name: 'mongodb',
    version: '1.0.0',
    register: async function (server, options) {
      server.logger.info('Setting up MongoDb')

      const client = await MongoClient.connect(options.mongoUrl, {
        retryWrites: options.retryWrites,
        readPreference: options.readPreference,
        ...(server.secureContext && { secureContext: server.secureContext })
      })

      const databaseName = options.databaseName
      const db = client.db(databaseName)
      const locker = new LockManager(db.collection('mongo-locks'))

      await createIndexes(db)

      server.logger.info(`MongoDb connected to ${databaseName}`)

      server.decorate('server', 'mongoClient', client)
      server.decorate('server', 'db', db)
      server.decorate('server', 'locker', locker)
      server.decorate('request', 'db', () => db, { apply: true })
      server.decorate('request', 'locker', () => locker, { apply: true })

      server.events.on('stop', async () => {
        server.logger.info('Closing Mongo client')
        await client.close(true)
      })
    }
  },
  options: {
    mongoUrl: config.get('mongoUri'),
    databaseName: config.get('mongoDatabase'),
    retryWrites: false,
    readPreference: 'secondary'
  }
}

async function createIndexes (db) {
  await db.collection('mongo-locks').createIndex({ id: 1 })

  // Example of how to create a mongodb index. Remove as required
  await db.collection('example-data').createIndex({ id: 1 })
}
