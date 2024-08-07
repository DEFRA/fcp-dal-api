import { organisationPersonSummary } from '../../fixtures/organisation.js'
import { pagination } from '../../fixtures/pagination.js'
import { personById } from '../../fixtures/person.js'
import { badRequestResponse, notFoundResponse, okOrNotFoundResponse, okResponse } from '../../utils/requestResponse.js'

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

            return okOrNotFoundResponse(res, data)
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
          middleware: (req, res) => {
            const body = req.body
            if (!body.searchFieldType || !body.primarySearchPhrase) {
              return badRequestResponse(res)
            }

            const person = personById({ customerReferenceNumber: body.primarySearchPhrase })

            if (!person) {
              return notFoundResponse(res)
            }

            return okResponse(res, {
              _data: [person._data],
              _page: pagination
            })
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

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  }
]
