import hapi from '@hapi/hapi'

import { healthyRoute } from './routes/healthy.js'
import { healthzRoute } from './routes/healthz.js'
import { setupAppInsights } from './insights.js'

setupAppInsights()

export const server = hapi.server({
  port: process.env.PORT
})

const routes = [].concat(healthyRoute, healthzRoute)

server.route(routes)
