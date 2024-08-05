import { messages } from '../../fixtures/messages.js'
import { badRequestResponse, okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rpp-messages',
    url: '/rpp/notifications',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const personId = req.query.personId
            if (!personId) {
              return badRequestResponse(res)
            }

            const data = messages(personId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  }
]
