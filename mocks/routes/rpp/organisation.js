import { pagination } from '../../fixtures/pagination.js'
import { organisation, organisations } from '../../fixtures/organisation.js'
import { organisationPersonSummary } from '../../fixtures/organisation-person-summary.js'

export default [
  {
    id: 'rpp-organisation-get-by-id',
    url: '/rpp/api/organisation/:orgId',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: { _data: organisation }
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
            try {
              const body = req.body
              if (!body.searchFieldType || !body.primarySearchPhrase) {
                throw new Error('Invalid request')
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  _data: organisations,
                  _page: pagination
                })
              )
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
    id: 'rpp-organisation-get-person-summary-by-person-id',
    url: '/rpp/api/organisation/person/:personId/summary',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            _data: [organisationPersonSummary]
          }
        }
      }
    ]
  }
]
