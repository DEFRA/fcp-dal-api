import { sitiAgriApiAuthorisationOrganisation } from '../../fixtures/authorisation.js'
import { organisationCPH, organisationCPHInfo } from '../../fixtures/organisation-cph.js'

export default [
  {
    id: 'rpp-siti-agri-api-get-authorisation-by-organisation-id',
    url: '/rpp/SitiAgriApi/authorisation/organisation/:organisationId/authorisation',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            data: sitiAgriApiAuthorisationOrganisation
          }
        }
      }
    ]
  },
  {
    id: 'rpp-siti-agri-api-get-cph-for-organisation-by-id',
    url: '/rpp/SitiAgriApi/cph/organisation/:organisationId/cph-numbers',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            data: organisationCPH
          }
        }
      }
    ]
  },
  {
    id: 'rpp-siti-agri-api-get-cph-info-for-organisation-by-id',
    url: '/rpp/SitiAgriApi/cph/organisation/:organisationId/cph-numbers/:cphNumber',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            data: organisationCPHInfo
          }
        }
      }
    ]
  }
]
