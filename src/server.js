import Hapi from '@hapi/hapi'

import { failAction } from './common/helpers/fail-action.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { pulse } from './common/helpers/pulse.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { secureContext } from './common/helpers/secure-context/index.js'
import { config } from './config.js'
import { router } from './plugins/router.js'

async function createServer () {
  setupProxy()
  const server = Hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        },
        failAction
      },
      security: {
        /* cspell:disable-next-line */
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        /* cspell:disable-next-line */
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // Hapi Plugins:
  // requestLogger  - automatically logs incoming requests
  // requestTracing - trace header logging and propagation
  // secureContext  - loads CA certificates from environment config
  // pulse          - provides shutdown handlers
  // router         - routes used in the app
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    router
  ])

  return server
}

export { createServer }
