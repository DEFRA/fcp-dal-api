import { coversSummary, landCovers, landParcels, parcelSummary } from '../../fixtures/lms.js'
import { okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rpp-lms-get-land-covers',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/land-covers',
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
    id: 'rpp-lms-get-parcels',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/parcels',
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
    id: 'rpp-lms-get-parcels-summary',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/parcels/bo-summary',
    method: 'GET',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = parcelSummary(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rpp-lms-get-covers-summary',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/covers-summary',
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
