import { messages } from '../../fixtures/messages.js'
import { badRequestResponse, okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rural-payments-messages',
    url: '/v1/notifications',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const personId = req.query.personId
            const page = req.query.page
            const size = req.query.size

            if (!personId) {
              return badRequestResponse(res)
            }

            const data = messages(personId, page, size)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  }
]
