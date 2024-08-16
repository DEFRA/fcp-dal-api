const ruralPaymentsPortalRoutes = [
  'rpp-authenticate-get-login:default',
  'rpp-authenticate-post-login:default',
  'rpp-authenticate-get-authenticate:default',
  'rpp-authenticate-get-person-context:default',
  'rpp-authenticate-get-expire-user-session:default',

  'rpp-lms-get-parcels-summary:default',

  'rpp-siti-agri-api-get-cph-for-organisation-by-id:default',
  'rpp-siti-agri-api-get-cph-info-for-organisation-by-id:default'
]

const release1Routes = [
  'apim-authentication-get-token:default',

  'rural-payments-person-get-by-id:default',
  'rural-payments-person-get-by-crn:default',
  'rural-payments-get-person-organisations-summary-by-person-id:default',
  'rural-payments-organisation-get-by-id:default',
  'rural-payments-organisation-get-by-sbi:default',
  'rural-payments-organisation-get-people-by-org-id:default',

  'rural-payments-organisation-get-person-summary-by-person-id:default',
  'rural-payments-organisation-applications-get-by-id:default',

  'rural-payments-lms-get-covers-summary:default',
  'rural-payments-lms-get-land-covers:default',
  'rural-payments-lms-get-parcels:default',

  'rural-payments-messages:default'
]

export default [
  {
    id: 'rural-payments-portal',
    routes: ruralPaymentsPortalRoutes
  },
  {
    id: 'release-1',
    routes: release1Routes
  },
  {
    id: 'all',
    routes: [...ruralPaymentsPortalRoutes, ...release1Routes]
  }
]
