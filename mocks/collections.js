const routes = [
  'apim-authentication-get-token:default',

  'rural-payments-person-get-by-id:default',
  'rural-payments-person-get-by-crn:default',
  'rural-payments-get-person-organisations-summary-by-person-id:default',
  'rural-payments-organisation-get-by-id:default',
  'rural-payments-organisation-get-by-sbi:default',
  'rural-payments-organisation-get-people-by-org-id:default',

  'rural-payments-lms-get-covers-summary:default',
  'rural-payments-lms-get-land-covers:default',
  'rural-payments-lms-get-parcels:default',

  'rural-payments-messages:default',

  'rural-payments-siti-agri-api-get-cph-for-organisation-by-id:default',
  'rural-payments-siti-agri-api-get-cph-info-for-organisation-by-id:default'
]

export default [
  {
    id: 'all',
    routes
  }
]
