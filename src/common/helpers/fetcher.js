import { Client } from 'undici'
import { config } from '../../config.js'
import { createLogger } from './logging/logger.js'

const decodeBase64 = (value = '') => Buffer.from(value, 'base64').toString('ascii')

let client
const logger = createLogger()
const fetch = (path, method = 'GET') => {
  logger.info(`Fetching ${path} with method ${method}`)
  return client.request({ path, method })
}

export default {
  decodeBase64,
  get fetch () {
    if (!client) {
      const tls = {
        key: decodeBase64(config.get('kitsConnection.key')),
        cert: decodeBase64(config.get('kitsConnection.cert')),
        rejectUnauthorized: false,
        servername: config.get('kitsConnection.host')
      }
      const kitsURL = new URL(config.get('kitsConnection.path'), `https://${config.get('kitsConnection.host')}`)
      kitsURL.port = config.get('kitsConnection.port')

      logger.info(`Creating new client for ${kitsURL.href} with tls options: ${JSON.stringify(tls)}`)
      client = new Client(kitsURL.href, { connect: tls })
    }

    return fetch
  }
}
