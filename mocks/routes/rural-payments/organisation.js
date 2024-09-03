import {
  organisationByOrgId,
  organisationBySbi,
  organisationPeopleByOrgId
} from '../../fixtures/organisation.js'
import {
  okOrNotFoundResponse,
  badRequestResponse,
  okResponse
} from '../../utils/requestResponse.js'

export default [
  {
    id: 'rural-payments-organisation-get-by-id',
    url: '/v1/organisation/:orgId',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = organisationByOrgId(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rural-payments-organisation-get-by-sbi',
    url: '/v1/organisation/search',
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

            const searchPhrase = body.primarySearchPhrase
            const data = organisationBySbi(searchPhrase)

            if (!data) {
              return okResponse(res)
            }

            return okResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rural-payments-organisation-get-people-by-org-id',
    url: '/v1/authorisation/organisation/:orgId',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = organisationPeopleByOrgId(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  }
]
