import { pagination } from '../../fixtures/pagination.js'
import { personById } from '../../fixtures/person.js'
import { okOrNotFoundResponse, okResponse, badRequestResponse, notFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rpp-person-get-by-id',
    url: '/rpp/api/person/:personId',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const id = req.params.personId
            const data = personById({ id })

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rpp-person-get-by-crn',
    url: '/rpp/api/person/search',
    method: ['POST'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const body = req.body
            if (!body.searchFieldType || !body.primarySearchPhrase) {
              return badRequestResponse(res)
            }

            const data = personById({ customerReferenceNumber: body.primarySearchPhrase })

            if (!data) {
              return notFoundResponse(res)
            }

            return okResponse(res, {
              ...data,
              _page: pagination
            })
          }
        }
      }
    ]
  }
]
