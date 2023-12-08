import { sitiAgriApiAuthorisationOrganisation } from '../../fixtures/authorisation.js'

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
  }
]
