import { v4 as uuidv4 } from 'uuid'

const existingEnvVars = process.env

const loadFreshConfig = async () => {
  return await import(`../../../app/config.js?update=${uuidv4()}`)
}

describe('config', () => {
  afterAll(() => {
    process.env = existingEnvVars
  })

  beforeEach(() => {
    delete process.env.NODE_ENV
    delete process.env.PORT
    delete process.env.LOG_LEVEL
    delete process.env.ALL_SCHEMA_ON
    delete process.env.GRAPHQL_DASHBOARD_ENABLED
    delete process.env.HEALTH_CHECK_ENABLED
    delete process.env.HEALTH_CHECK_RP_PORTAL_EMAIL
    delete process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID
    delete process.env.HEALTH_CHECK_RP_THROTTLE_TIME_MS
    delete process.env.KITS_REQUEST_PAGE_SIZE
    delete process.env.KITS_INTERNAL_CONNECTION_CERT
    delete process.env.KITS_INTERNAL_CONNECTION_KEY
    delete process.env.KITS_EXTERNAL_CONNECTION_CERT
    delete process.env.KITS_EXTERNAL_CONNECTION_KEY
    delete process.env.ADMIN_AD_GROUP_ID
    delete process.env.OIDC_JWKS_TIMEOUT_MS
    delete process.env.OIDC_JWKS_URI
  })

  it('should have default values when optional env vars are unset', async () => {
    process.env.DISABLE_AUTH = 'true'
    process.env.KITS_DISABLE_MTLS = 'true'
    process.env.HEALTH_CHECK_ENABLED = 'false'

    const { config } = await loadFreshConfig()

    expect(config.get('nodeEnv')).toBe('production')
    expect(config.get('port')).toBe(3000)
    expect(config.get('logLevel')).toBe('info')
    expect(config.get('allSchemaOn')).toBe(false)
    expect(config.get('auth.disabled')).toBe(true)
    expect(config.get('auth.groups.ADMIN')).toBe(null)
    expect(config.get('graphqlDashboardEnabled')).toBe(false)
    expect(config.get('healthCheck.enabled')).toBe(false)
    expect(config.get('healthCheck.throttleTimeMs')).toBe(300000)
    expect(config.get('kits.requestPageSize')).toBe(100)
    expect(config.get('kits.disableMTLS')).toBe(true)
    expect(config.get('kits.internal.connectionCert')).toBe(null)
    expect(config.get('kits.internal.connectionKey')).toBe(null)
    expect(config.get('kits.external.connectionCert')).toBe(null)
    expect(config.get('kits.external.connectionKey')).toBe(null)
    expect(config.get('oidc.jwksURI')).toBe(null)
    expect(config.get('oidc.timeoutMs')).toBe(null)
  })

  it('should read values from the environment when supplied', async () => {
    process.env.NODE_ENV = 'development'
    process.env.ENVIRONMENT = 'test'
    process.env.HTTPS_PROXY = 'http://proxy.example.com'
    process.env.PORT = '4000'
    process.env.LOG_LEVEL = 'debug'
    process.env.ALL_SCHEMA_ON = 'true'
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'true'
    process.env.DAL_REQUEST_TIMEOUT_MS = '1500'
    process.env.OIDC_JWKS_URI = 'https://example.com/jwks'
    process.env.OIDC_JWKS_TIMEOUT_MS = '5000'
    process.env.DISABLE_AUTH = 'false'
    process.env.ADMIN_AD_GROUP_ID = 'admin-group-id'
    process.env.CONSOLIDATED_VIEW_AD_GROUP_ID = 'consolidated-view-group-id'
    process.env.SINGLE_FRONT_DOOR_AD_GROUP_ID = 'single-front-door-group-id'
    process.env.SFI_REFORM_AD_GROUP_ID = 'sfi-reform-group-id'
    process.env.HEALTH_CHECK_ENABLED = 'true'
    process.env.HEALTH_CHECK_RP_PORTAL_EMAIL = 'healthcheck@example.com'
    process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID = 'org-id'
    process.env.HEALTH_CHECK_RP_THROTTLE_TIME_MS = '1000'
    process.env.KITS_INTERNAL_CONNECTION_CERT = 'internal-cert-value'
    process.env.KITS_INTERNAL_CONNECTION_KEY = 'internal-key-value'
    process.env.KITS_INTERNAL_GATEWAY_URL = 'https://internal.example.com'
    process.env.KITS_EXTERNAL_CONNECTION_CERT = 'external-cert-value'
    process.env.KITS_EXTERNAL_CONNECTION_KEY = 'external-key-value'
    process.env.KITS_EXTERNAL_GATEWAY_URL = 'https://external.example.com'
    process.env.KIT_EXT_PERSON_ID_OVERRIDE = '123456'
    process.env.KITS_DISABLE_MTLS = 'true'
    process.env.KITS_CA_CERT = 'ca-cert-value'
    process.env.KITS_GATEWAY_TIMEOUT_MS = '2000'
    process.env.KITS_REQUEST_PAGE_SIZE = '50'
    process.env.KITS_DAL_SERVICE_ACCOUNT_EMAIL = 'service-account@example.com'
    process.env.HITACHI_DISABLE_AUTH = 'false'
    process.env.HITACHI_BASE_URL = 'https://hitachi.example.com'
    process.env.HITACHI_TIMEOUT_MS = '2500'
    process.env.HITACHI_ENTRA_TENANT_ID = 'hitachi-tenant-id'
    process.env.HITACHI_ENTRA_CLIENT_ID = 'hitachi-client-id'
    process.env.HITACHI_ENTRA_CLIENT_SECRET = 'hitachi-client-secret'
    process.env.MONGO_URI = 'mongodb://example.com:27017'
    process.env.MONGO_DATABASE = 'test-database'
    process.env.MONGO_RETRY_WRITES = 'false'
    process.env.MONGO_READ_PREFERENCE = 'secondary'
    process.env.MONGO_TIMEOUT_MS = '4000'

    const { config } = await loadFreshConfig()

    expect(config.get('nodeEnv')).toBe('development')
    expect(config.get('cdp.env')).toBe('test')
    expect(config.get('cdp.httpsProxy')).toBe('http://proxy.example.com')
    expect(config.get('port')).toBe(4000)
    expect(config.get('logLevel')).toBe('debug')
    expect(config.get('allSchemaOn')).toBe(true)
    expect(config.get('graphqlDashboardEnabled')).toBe(true)
    expect(config.get('requestTimeoutMs')).toBe(1500)
    expect(config.get('oidc.jwksURI')).toBe('https://example.com/jwks')
    expect(config.get('oidc.timeoutMs')).toBe(5000)
    expect(config.get('auth.disabled')).toBe(false)
    expect(config.get('auth.groups.ADMIN')).toBe('admin-group-id')
    expect(config.get('auth.groups.CONSOLIDATED_VIEW')).toBe('consolidated-view-group-id')
    expect(config.get('auth.groups.SINGLE_FRONT_DOOR')).toBe('single-front-door-group-id')
    expect(config.get('auth.groups.SFI_REFORM')).toBe('sfi-reform-group-id')
    expect(config.get('healthCheck.enabled')).toBe(true)
    expect(config.get('healthCheck.ruralPaymentsPortalEmail')).toBe('healthcheck@example.com')
    expect(config.get('healthCheck.ruralPaymentsInternalOrganisationId')).toBe('org-id')
    expect(config.get('healthCheck.throttleTimeMs')).toBe(1000)
    expect(config.get('kits.internal.connectionCert')).toBe('internal-cert-value')
    expect(config.get('kits.internal.connectionKey')).toBe('internal-key-value')
    expect(config.get('kits.internal.gatewayUrl')).toBe('https://internal.example.com')
    expect(config.get('kits.external.connectionCert')).toBe('external-cert-value')
    expect(config.get('kits.external.connectionKey')).toBe('external-key-value')
    expect(config.get('kits.external.gatewayUrl')).toBe('https://external.example.com')
    expect(config.get('kits.external.personIdOverride')).toBe(123456)
    expect(config.get('kits.disableMTLS')).toBe(true)
    expect(config.get('kits.caCert')).toBe('ca-cert-value')
    expect(config.get('kits.gatewayTimeoutMs')).toBe(2000)
    expect(config.get('kits.requestPageSize')).toBe(50)
    expect(config.get('kits.dalServiceAccountEmail')).toBe('service-account@example.com')
    expect(config.get('hitachi.disableAuth')).toBe(false)
    expect(config.get('hitachi.baseUrl')).toBe('https://hitachi.example.com')
    expect(config.get('hitachi.timeoutMs')).toBe(2500)
    expect(config.get('hitachi.entra.tenantId')).toBe('hitachi-tenant-id')
    expect(config.get('hitachi.entra.clientId')).toBe('hitachi-client-id')
    expect(config.get('hitachi.entra.clientSecret')).toBe('hitachi-client-secret')
    expect(config.get('mongo.mongoUrl')).toBe('mongodb://example.com:27017')
    expect(config.get('mongo.databaseName')).toBe('test-database')
    expect(config.get('mongo.mongoOptions.retryWrites')).toBe(false)
    expect(config.get('mongo.mongoOptions.readPreference')).toBe('secondary')
    expect(config.get('mongo.mongoOptions.timeoutMS')).toBe(4000)
  })

  it('should throw an error with any invalid combinations of env vars', async () => {
    // These are in a single test to avoid race conditions when setting env vars
    process.env.KITS_DISABLE_MTLS = 'true'
    process.env.HEALTH_CHECK_ENABLED = 'false'
    let expectedErrors

    // DISABLE_AUTH check
    process.env.DISABLE_AUTH = 'false'
    expectedErrors = ['oidc.jwksURI: must be of type String', 'oidc.timeoutMs: must be an integer']
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
    process.env.DISABLE_AUTH = 'true'

    // KITS_DISABLE_MTLS check
    process.env.KITS_DISABLE_MTLS = 'false'
    expectedErrors = [
      'kits.internal.connectionCert: must be of type String',
      'kits.internal.connectionKey: must be of type String',
      'kits.external.connectionCert: must be of type String',
      'kits.external.connectionKey: must be of type String'
    ]
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
    process.env.KITS_DISABLE_MTLS = 'true'

    // HEALTH_CHECK_ENABLED check
    process.env.HEALTH_CHECK_ENABLED = 'true'
    expectedErrors = [
      'healthCheck.ruralPaymentsPortalEmail: must be of type String',
      'healthCheck.ruralPaymentsInternalOrganisationId: must be of type String'
    ]
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
    process.env.HEALTH_CHECK_ENABLED = 'false'

    // KITS_DAL_SERVICE_ACCOUNT_EMAIL check
    const dalServiceAccountEmail = process.env.KITS_DAL_SERVICE_ACCOUNT_EMAIL
    delete process.env.KITS_DAL_SERVICE_ACCOUNT_EMAIL
    expectedErrors = ['kits.dalServiceAccountEmail: must be of type String']
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
    process.env.KITS_DAL_SERVICE_ACCOUNT_EMAIL = dalServiceAccountEmail
  })

  it('should throw on invalid values', async () => {
    process.env.NODE_ENV = 'invalid'
    await expect(loadFreshConfig()).rejects.toThrow(
      'nodeEnv: must be one of the possible values: ["production","development","test"]: value was "invalid"'
    )
  })

  it('should allow optional fields to be unset', async () => {
    const { config } = await loadFreshConfig()

    expect(() => config.set('healthCheck.ruralPaymentsPortalEmail', null)).not.toThrow()
    expect(() => config.set('healthCheck.ruralPaymentsInternalOrganisationId', null)).not.toThrow()
    expect(() => config.set('oidc.timeoutMs', null)).not.toThrow()
    expect(() => config.set('oidc.jwksURI', null)).not.toThrow()
    expect(() => config.set('kits.internal.connectionCert', null)).not.toThrow()
    expect(() => config.set('kits.internal.connectionKey', null)).not.toThrow()
    expect(() => config.set('kits.external.connectionCert', null)).not.toThrow()
    expect(() => config.set('kits.external.connectionKey', null)).not.toThrow()
    expect(() => config.set('auth.groups.ADMIN', null)).not.toThrow()
  })

  it('should unpack base64 encoded config values', async () => {
    process.env.KITS_DISABLE_MTLS = 'false'
    process.env.KITS_INTERNAL_CONNECTION_CERT = Buffer.from('internal-cert').toString('base64')
    process.env.KITS_INTERNAL_CONNECTION_KEY = Buffer.from('internal-key').toString('base64')
    process.env.KITS_EXTERNAL_CONNECTION_CERT = Buffer.from('external-cert').toString('base64')
    process.env.KITS_EXTERNAL_CONNECTION_KEY = Buffer.from('external-key').toString('base64')
    process.env.KITS_CA_CERT = Buffer.from('ca-cert').toString('base64')

    const { config } = await loadFreshConfig()
    expect(config.internalMTLS).toEqual({
      cert: 'internal-cert',
      key: 'internal-key',
      ca: 'ca-cert'
    })
    expect(config.externalMTLS).toEqual({
      cert: 'external-cert',
      key: 'external-key',
      ca: 'ca-cert'
    })
  })
})

describe('decodeBase64Config', () => {
  it('should decode base64 strings from config', async () => {
    const config = await loadFreshConfig()
    const encodedString = Buffer.from('test-string').toString('base64')
    const decoded = config.decodeBase64Config(encodedString)
    expect(decoded).toBe('test-string')
  })
})
