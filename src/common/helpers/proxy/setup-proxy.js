import { ProxyAgent, setGlobalDispatcher } from 'undici'

import { config } from '../../../config.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

/**
 * If HTTP_PROXY is set setupProxy() will enable it globally
 * for undici http clients.
 */
export function setupProxy () {
  const proxyUrl = config.get('httpProxy')

  if (proxyUrl) {
    logger.info('setting up global proxies')

    // Undici proxy
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
  }
}
