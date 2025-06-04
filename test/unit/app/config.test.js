describe('config', () => {
  const loadFreshConfig = async () => {
    return await import(`../../../app/config.js?update=${Date.now()}`)
  }

  beforeEach(() => {
    delete process.env.NODE_ENV
    delete process.env.PORT
    delete process.env.LOG_LEVEL
    delete process.env.ALL_SCHEMA_ON
    delete process.env.DISABLE_AUTH
    delete process.env.GRAPHQL_DASHBOARD_ENABLED
    delete process.env.HEALTH_CHECK_ENABLED
    delete process.env.HEALTH_CHECK_RP_PORTAL_EMAIL
    delete process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID
    delete process.env.HEALTH_CHECK_RP_THROTTLE_TIME_MS
    delete process.env.KITS_REQUEST_PAGE_SIZE
    delete process.env.KITS_CONNECTION_CERT
    delete process.env.KITS_CONNECTION_KEY
    delete process.env.ADMIN_AD_GROUP_ID
    delete process.env.CDP_HTTPS_PROXY
    delete process.env.CDP_HTTP_PROXY
    delete process.env.OIDC_JWKS_TIMEOUT_MS
    delete process.env.OIDC_JWKS_URI
  })

  it('should have default values', async () => {
    const { config } = await loadFreshConfig()

    expect(config.get('nodeEnv')).toBe('production')
    expect(config.get('port')).toBe(3000)
    expect(config.get('logLevel')).toBe('info')
    expect(config.get('allSchemaOn')).toBe(false)
    expect(config.get('auth.disabled')).toBe(false)
    expect(config.get('auth.groups.admin')).toBe(null)
    expect(config.get('graphqlDashboardEnabled')).toBe(false)
    expect(config.get('healthCheck.enabled')).toBe(true)
    expect(config.get('healthCheck.throttleTimeMs')).toBe(300000)
    expect(config.get('kits.requestPageSize')).toBe(100)
    expect(config.get('kits.disableMTLS')).toBe(false)
    expect(config.get('kits.connectionCert')).toBe(null)
    expect(config.get('kits.connectionKey')).toBe(null)
    expect(config.get('cdp.httpsProxy')).toBe(null)
    expect(config.get('cdp.httpProxy')).toBe(null)
    expect(config.get('disableProxy')).toBe(false)
    expect(config.get('oidc.jwksURI')).toBe(null)
    expect(config.get('oidc.timeoutMs')).toBe(null)
  })

  it('should override values with environment variables', async () => {
    process.env.NODE_ENV = 'development'
    process.env.PORT = '4000'
    process.env.LOG_LEVEL = 'debug'
    process.env.ALL_SCHEMA_ON = 'true'
    process.env.DISABLE_AUTH = 'true'
    process.env.GRAPHQL_DASHBOARD_ENABLED = 'true'
    process.env.DAL_REQUEST_TIMEOUT_MS = '1234'
    process.env.ENVIRONMENT = 'dev'
    process.env.HEALTH_CHECK_ENABLED = 'false'
    process.env.HEALTH_CHECK_RP_PORTAL_EMAIL = 'test@example.com'
    process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID = 'org123'
    process.env.HEALTH_CHECK_RP_THROTTLE_TIME_MS = '1111'
    process.env.KITS_REQUEST_PAGE_SIZE = '50'
    process.env.KITS_CONNECTION_CERT = 'certContent'
    process.env.KITS_CONNECTION_KEY = 'keyContent'
    process.env.KITS_DISABLE_MTLS = 'true'
    process.env.CDP_HTTPS_PROXY = 'https://proxy.example.com'
    process.env.CDP_HTTP_PROXY = 'http://proxy.example.com'
    process.env.DISABLE_PROXY = 'true'
    process.env.OIDC_JWKS_TIMEOUT_MS = '5000'
    process.env.OIDC_JWKS_URI = 'https://oidc.example.com/jwks'
    process.env.ADMIN_AD_GROUP_ID = 'group-id'

    const { config } = await loadFreshConfig()

    expect(config.get('nodeEnv')).toBe('development')
    expect(config.get('port')).toBe(4000)
    expect(config.get('logLevel')).toBe('debug')
    expect(config.get('allSchemaOn')).toBe(true)
    expect(config.get('auth.disabled')).toBe(true)
    expect(config.get('auth.groups.admin')).toBe('group-id')
    expect(config.get('graphqlDashboardEnabled')).toBe(true)
    expect(config.get('requestTimeoutMs')).toBe(1234)
    expect(config.get('cdp.env')).toBe('dev')
    expect(config.get('healthCheck.enabled')).toBe(false)
    expect(config.get('healthCheck.ruralPaymentsPortalEmail')).toBe('test@example.com')
    expect(config.get('healthCheck.ruralPaymentsInternalOrganisationId')).toBe('org123')
    expect(config.get('healthCheck.throttleTimeMs')).toBe(1111)
    expect(config.get('kits.requestPageSize')).toBe(50)
    expect(config.get('kits.connectionCert')).toBe('certContent')
    expect(config.get('kits.connectionKey')).toBe('keyContent')
    expect(config.get('kits.disableMTLS')).toBe(true)
    expect(config.get('cdp.httpsProxy')).toBe('https://proxy.example.com')
    expect(config.get('cdp.httpProxy')).toBe('http://proxy.example.com')
    expect(config.get('disableProxy')).toBe(true)
    expect(config.get('oidc.timeoutMs')).toBe(5000)
    expect(config.get('oidc.jwksURI')).toBe('https://oidc.example.com/jwks')
  })

  it('should throw on invalid values', async () => {
    process.env.NODE_ENV = 'invalid'
    await expect(loadFreshConfig()).rejects.toThrow(
      'nodeEnv: must be one of the possible values: ["production","development","test"]: value was "invalid"'
    )
  })

  it('should allow nullable healthCheck fields', async () => {
    const { config } = await loadFreshConfig()

    expect(() => config.set('healthCheck.ruralPaymentsPortalEmail', null)).not.toThrow()
    expect(() => config.set('healthCheck.ruralPaymentsInternalOrganisationId', null)).not.toThrow()
    expect(() => config.set('oidc.timeoutMs', null)).not.toThrow()
    expect(() => config.set('oidc.jwksURI', null)).not.toThrow()
    expect(() => config.set('cdp.httpsProxy', null)).not.toThrow()
    expect(() => config.set('cdp.httpProxy', null)).not.toThrow()
    expect(() => config.set('kits.connectionCert', null)).not.toThrow()
    expect(() => config.set('kits.connectionKey', null)).not.toThrow()
    expect(() => config.set('auth.groups.admin', null)).not.toThrow()
  })
})
