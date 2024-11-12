import { organisationApplicationsByOrgId } from '../../fixtures/organisation.js'
import { okOrNotFoundResponse } from '../../utils/requestResponse.js'

export default [
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

            return okOrNotFoundResponse(res, { _data: data })
          }
        }
      }
    ]
  }
]
