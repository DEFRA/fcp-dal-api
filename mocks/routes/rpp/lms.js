import {
  coversSummary,
  landCovers,
  landParcels,
  totalArea,
  totalParcels
} from '../../fixtures/lms.js'

export default [
  {
    id: 'rpp-lms-get-land-covers',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/land-covers',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: landCovers
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
        type: 'json',
        options: {
          status: 200,
          body: landParcels
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
        type: 'json',
        options: {
          status: 200,
          body: {
            totalParcels,
            totalArea
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
        type: 'json',
        options: {
          status: 200,
          body: coversSummary
        }
      }
    ]
  }
]
