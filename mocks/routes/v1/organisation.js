import {
  organisationByOrgId,
  organisationBySbi,
  organisationPeopleByOrgId
} from '../../fixtures/organisation.js'
import { okResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'v1-organisation-get-by-id',
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

            return okResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'v1-organisation-get-by-sbi',
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
              throw new Error('Invalid request')
            }

            const searchPhrase = body.primarySearchPhrase
            const data = organisationBySbi(searchPhrase)

            return okResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'v1-organisation-get-people-by-org-id',
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

            return okResponse(res, data)
          }
        }
      }
    ]
  }
]
