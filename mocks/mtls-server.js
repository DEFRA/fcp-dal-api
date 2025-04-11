import Server from '@mocks-server/core/src/server/Server.js'
import { readFileSync } from 'fs'
import { createServer } from 'https'

class MTLSServer extends Server {
  constructor({ config, alerts, routesRouter, logger }) {
    super({ config, alerts, routesRouter, logger })
  }

  _registerCustomRouters() {
    this._express.use((req, res, next) => {
      if (!req.client.authorized) {
        console.error('cert error:', req.client.authorizationError)
        res.status(401).json({ status: req.client.authorizationError })
      } else {
        next()
      }
    })
    super._registerCustomRouters()
  }

  _createHttpsServer() {
    this._logger.verbose('Creating HTTPS server')
    this._alerts.remove('https')

    try {
      this._logger.info(`Using TLS key: ${process.env.MOCK_SERVER_KEY}`)
      this._logger.info(`Using TLS cert: ${process.env.MOCK_SERVER_CERT}`)
      const tlsOptions = {
        cert: readFileSync(process.env.MOCK_SERVER_CERT),
        key: readFileSync(process.env.MOCK_SERVER_KEY),
        requestCert: true,
        rejectUnauthorized: false
      }
      if (process.env.MOCK_SERVER_CA) {
        // useful for testing outside of cdp emulator env!
        this._logger.info(`Using CA: ${process.env.MOCK_SERVER_CA}`)
        tlsOptions.ca = readFileSync(process.env.MOCK_SERVER_CA)
      }
      return createServer(tlsOptions, this._express)
    } catch (error) {
      this._alerts.set('https', 'Error creating HTTPS server', error)
      this._serverInitError = error
    }
  }

  _createServer() {
    this._server = null
    return process.env.MOCK_SERVER_CERT && process.env.MOCK_SERVER_KEY
      ? this._createHttpsServer()
      : this._createHttpServer()
  }

  _startServer(resolve, reject) {
    const host = this._hostOption.value || process.env.MOCK_SERVER_HOST || 'localhost'
    const port = this._portOption.value || Number(process.env.MOCK_SERVER_PORT || 3100)

    try {
      this._server.listen(
        {
          port,
          host
        },
        (error) => {
          if (error) {
            this._serverStarting = false
            this._serverStarted = false
            this._alerts.set('start', 'Error starting server', error)
            reject(error)
          } else {
            this._logger.info(`Server started and listening at ${this.url}`)
            this._serverStarting = false
            this._serverStarted = true
            this._alerts.remove('start')
            resolve(this)
          }
        }
      )
    } catch (error) {
      this._alerts.set('start', 'Error starting server', error)
      reject(error)
    }
  }
}

export { MTLSServer }
