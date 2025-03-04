import Boom from '@hapi/boom'
import { findAllExampleData, findExampleData } from '../example-find.js'

const example = [{
  method: 'GET',
  path: '/example',
  handler: async (request, h) => {
    const entities = await findAllExampleData(request.db)
    return h.response({ message: 'success', entities })
  }
},
{
  method: 'GET',
  path: '/example/{exampleId}',
  handler: async (request, h) => {
    const entity = await findExampleData(request.db, request.params.exampleId)

    if (!entity) {
      return Boom.notFound()
    }

    return h.response({ message: 'success', entity })
  }
}]

export { example }
