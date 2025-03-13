import fetcher from '../common/helpers/fetcher.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

const getBusiness = {
  method: 'GET',
  path: '/get-business/{id}',
  handler: async (request, h) => {
    logger.info(`GET /get-business with params: ${JSON.stringify(request.params)}`)
    const result = await fetcher.fetch(`organisation/${request.params.id}`)
    const { name, sbi, orgId } = result.body

    logger.info(`business object with keys: ${Object.keys(result.body)}`)

    h.response({ name, sbi, orgId })
  }
}

export { getBusiness }
