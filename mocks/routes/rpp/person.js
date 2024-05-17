import { pagination } from '../../fixtures/pagination.js'
import { personById } from '../../fixtures/person.js'
import { okResponse } from '../../utils/requestResponse.js'

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

            return okResponse(res, data)
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
          // person search
          middleware: (req, res) => {
            try {
              const body = req.body
              if (!body.searchFieldType || !body.primarySearchPhrase) {
                throw new Error('Invalid request')
              }

              return okResponse(res, {
                _data: [personById({ customerReferenceNumber: body.primarySearchPhrase })._data],
                _page: pagination
              })
            } catch (error) {
              res.status(400)
              res.send()
            }
          }
        }
      }
    ]
  }
]
