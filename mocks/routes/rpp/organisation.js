import {
  organisationApplicationsByOrgId,
  organisationByOrgId,
  organisationBySbi,
  organisationPeopleByOrgId,
  organisationPersonSummary
} from '../../fixtures/organisation.js'
import { okResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rpp-organisation-get-by-id',
    url: '/rpp/api/organisation/:orgId',
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
    id: 'rpp-organisation-get-by-sbi',
    url: '/rpp/api/organisation/search',
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
    id: 'rpp-organisation-get-person-summary-by-person-id',
    url: '/rpp/api/organisation/person/:personId/summary',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const personId = req.params.personId
            const sbi = req.query.organisationId
            const data = organisationPersonSummary({ id: personId, sbi })

            return okResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rpp-organisation-get-people-by-org-id',
    url: '/rpp/api/authorisation/organisation/:orgId',
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
  },
  {
    id: 'rpp-organisation-applications-get-by-id',
    url: '/rpp/injected-screens-mt/api/organisation/:orgId/applications/appslist',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = organisationApplicationsByOrgId(orgId)

            return okResponse(res, { _data: data })
          }
        }
      }
    ]
  }
]
