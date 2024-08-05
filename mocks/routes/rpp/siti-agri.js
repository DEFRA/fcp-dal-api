import { sitiAgriAuthorisationOrganisation } from '../../fixtures/authorisation.js'
import { organisationCPH, organisationCPHInfo } from '../../fixtures/organisation-cph.js'
import { okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rpp-siti-agri-api-get-authorisation-by-organisation-id',
    url: '/rpp/SitiAgriApi/authorisation/organisation/:organisationId/authorisation',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const organisationId = req.params.organisationId
            const data = sitiAgriAuthorisationOrganisation({ organisationId })

            return okOrNotFoundResponse(res, data)
          }
        }
      }
    ]
  },
  {
    id: 'rpp-siti-agri-api-get-cph-for-organisation-by-id',
    url: '/rpp/SitiAgriApi/cph/organisation/:orgId/cph-numbers',
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
    id: 'rpp-siti-agri-api-get-cph-info-for-organisation-by-id',
    url: '/rpp/SitiAgriApi/cph/organisation/:orgId/cph-numbers/:cphNumber',
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
