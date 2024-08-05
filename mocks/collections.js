export default [
  {
    id: 'rural-payments-portal',
    routes: [
      'rpp-authenticate-get-login:default',
      'rpp-authenticate-post-login:default',
      'rpp-authenticate-get-authenticate:default',
      'rpp-authenticate-get-person-context:default',
      'rpp-authenticate-get-expire-user-session:default',

      'rpp-organisation-get-by-id:default',
      'rpp-organisation-get-by-sbi:default',
      'rpp-organisation-get-person-summary-by-person-id:default',
      'rpp-organisation-get-people-by-org-id:default',
      'rpp-organisation-applications-get-by-id:default',

      'rpp-person-get-by-id:default',
      'rpp-person-get-by-crn:default',

      'rpp-lms-get-land-covers:default',
      'rpp-lms-get-parcels:default',
      'rpp-lms-get-parcels-summary:default',
      'rpp-lms-get-covers-summary:default',

      'rpp-siti-agri-api-get-authorisation-by-organisation-id:default',
      'rpp-siti-agri-api-get-cph-for-organisation-by-id:default',
      'rpp-siti-agri-api-get-cph-info-for-organisation-by-id:default',

      'rpp-messages:default'
    ]
  },
  {
    id: 'release-1',
    routes: [
      'apim-authentication-get-token:default',

      'rpp-authenticate-get-login:default',
      'rpp-authenticate-post-login:default',
      'rpp-authenticate-get-authenticate:default',
      'rpp-authenticate-get-person-context:default',
      'rpp-authenticate-get-expire-user-session:default',

      'v1-person-get-by-id:default',
      'v1-person-get-by-crn:default',
      'v1-get-person-organisations-summary-by-person-id:default',

      'v1-organisation-get-by-id:default',
      'v1-organisation-get-by-sbi:default',
      // 'v1-organisation-get-person-summary-by-person-id:default',
      'v1-organisation-get-people-by-org-id:default',
      'v1-siti-agri-api-get-authorisation-by-organisation-id:default'
    ]
  }
]
