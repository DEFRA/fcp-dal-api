import hapi from '@hapi/hapi'
import mockServer from '../mocks/server.js'

import { healthyRoute } from './routes/healthy.js'
import { healthzRoute } from './routes/healthz.js'
import { setupAppInsights } from './insights.js'

setupAppInsights()

export const server = hapi.server({
  port: process.env.PORT
})

const routes = [].concat(healthyRoute, healthzRoute)

server.route(routes)

if (process.env.ENABLE_MOCK_SERVER) {
  mockServer.start()
}