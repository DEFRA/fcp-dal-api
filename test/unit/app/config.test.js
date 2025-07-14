describe('config', () => {
  const loadFreshConfig = async () => {
    return await import(`../../../app/config.js?update=${Date.now()}`)
  }

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
    delete process.env.KITS_CONNECTION_CERT
    delete process.env.KITS_CONNECTION_KEY
    delete process.env.ADMIN_AD_GROUP_ID
    delete process.env.CDP_HTTPS_PROXY
    delete process.env.CDP_HTTP_PROXY
    delete process.env.OIDC_JWKS_TIMEOUT_MS
    delete process.env.OIDC_JWKS_URI
  })

  it('should have default values when optional env vars are unset', async () => {
    process.env.DISABLE_AUTH = 'true'
    process.env.KITS_DISABLE_MTLS = 'true'
    process.env.DISABLE_PROXY = 'true'
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
    expect(config.get('kits.connectionCert')).toBe(null)
    expect(config.get('kits.connectionKey')).toBe(null)
    expect(config.get('cdp.httpsProxy')).toBe(null)
    expect(config.get('cdp.httpProxy')).toBe(null)
    expect(config.get('disableProxy')).toBe(true)
    expect(config.get('oidc.jwksURI')).toBe(null)
    expect(config.get('oidc.timeoutMs')).toBe(null)
  })

  it('should throw an error any invalid combinations of env vars', async () => {
    // These are in a single test to avoid race conditions when setting env vars
    process.env.KITS_DISABLE_MTLS = 'true'
    process.env.DISABLE_PROXY = 'true'
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
      'kits.connectionCert: must be of type String',
      'kits.connectionKey: must be of type String'
    ]
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
    process.env.KITS_DISABLE_MTLS = 'true'

    // DISABLE_PROXY check
    process.env.DISABLE_PROXY = 'false'
    expectedErrors = [
      'cdp.httpsProxy: must be of type String',
      'cdp.httpProxy: must be of type String'
    ]
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
    process.env.DISABLE_PROXY = 'true'

    // HEALTH_CHECK_ENABLED check
    process.env.HEALTH_CHECK_ENABLED = 'true'
    expectedErrors = [
      'healthCheck.ruralPaymentsPortalEmail: must be of type String',
      'healthCheck.ruralPaymentsInternalOrganisationId: must be of type String'
    ]
    await expect(loadFreshConfig()).rejects.toEqual(new Error(expectedErrors.join('\n')))
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
    expect(() => config.set('cdp.httpsProxy', null)).not.toThrow()
    expect(() => config.set('cdp.httpProxy', null)).not.toThrow()
    expect(() => config.set('kits.connectionCert', null)).not.toThrow()
    expect(() => config.set('kits.connectionKey', null)).not.toThrow()
    expect(() => config.set('auth.groups.ADMIN', null)).not.toThrow()
  })
})
