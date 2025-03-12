import { getBusiness } from '../routes/get-business.js'
import { health } from '../routes/health.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health, getBusiness])
    }
  }
}

export { router }
