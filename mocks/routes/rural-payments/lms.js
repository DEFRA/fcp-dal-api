import { coversSummary, landCovers, landParcels } from '../../fixtures/lms.js'
import { okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rural-payments-lms-get-land-covers',
    url: '/v1/lms/organisation/:orgId/land-covers',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = landCovers(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rural-payments-lms-get-parcels',
    url: '/v1/lms/organisation/:orgId/parcels',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = landParcels(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rural-payments-lms-get-covers-summary',
    url: '/v1/lms/organisation/:orgId/covers-summary/historic/:historicDate',
    method: 'GET',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = coversSummary(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  }
]
