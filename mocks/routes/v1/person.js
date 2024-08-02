import {
  organisationPersonSummary
} from '../../fixtures/organisation.js'
import { pagination } from '../../fixtures/pagination.js'
import { personById } from '../../fixtures/person.js'
import { okResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'v1-person-get-by-id',
    url: '/v1/person/:personId/summary',
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
    id: 'v1-person-get-by-crn',
    url: '/v1/person/search',
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
  },
  {
    id: 'v1-get-person-organisations-summary-by-person-id',
    url: '/v1/organisation/person/:personId/summary',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const personId = req.params.personId
            const data = organisationPersonSummary({ id: personId })
            console.log('data', data)

            return okResponse(res, data)
          }
        }
      }
    ]
  }
]
