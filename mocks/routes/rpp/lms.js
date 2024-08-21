import { parcelSummary } from '../../fixtures/lms.js'
import { okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
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
  }
]
