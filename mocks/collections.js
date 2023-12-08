export default [
  {
    id: 'base',
    routes: [
      'rpp-authenticate-get-login:default',
      'rpp-authenticate-post-login:default',
      'rpp-authenticate-get-authenticate:default',
      'rpp-authenticate-get-person-context:default',
      'rpp-authenticate-get-expire-user-session:default',

      'rpp-organisation-get-by-id:default',
      'rpp-organisation-get-by-sbi:default',
      'rpp-organisation-get-person-summary-by-person-id:default',

      'rpp-person-get-by-id:default',
      'rpp-person-get-by-crn:default',

      'rpp-lms-get-land-covers:default',
      'rpp-lms-get-parcels:default',

      'rpp-siti-agri-api-get-authorisation-by-organisation-id:default'
    ]
  }
]
