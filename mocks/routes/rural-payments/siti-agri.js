import {
  organisationCPH,
  organisationCPHInfo
} from '../../fixtures/organisation-cph.js'
import { okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rural-payments-siti-agri-api-get-cph-for-organisation-by-id',
    url: '/v1/SitiAgriApi/cph/organisation/:orgId/cph-numbers',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = organisationCPH(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rural-payments-siti-agri-api-get-cph-info-for-organisation-by-id',
    url: '/v1/SitiAgriApi/cph/organisation/:orgId/cph-numbers/:cphNumber',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const orgId = req.params.orgId
            const data = organisationCPHInfo(orgId)

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  }
]
