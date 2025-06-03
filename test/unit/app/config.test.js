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
  })

  it('should have default values', async () => {
    const { config } = await loadFreshConfig()

    expect(config.get('nodeEnv')).toBe('production')
    expect(config.get('port')).toBe(3000)
    expect(config.get('logLevel')).toBe('info')
    expect(config.get('allSchemaOn')).toBe(false)
    expect(config.get('disableAuth')).toBe(false)
    expect(config.get('graphqlDashboardEnabled')).toBe(false)
    expect(config.get('healthCheck.enabled')).toBe(true)
    expect(config.get('healthCheck.throttleTimeMs')).toBe(300000)
    expect(config.get('kits.requestPageSize')).toBe(100)
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

    const { config } = await loadFreshConfig()

    expect(config.get('nodeEnv')).toBe('development')
    expect(config.get('port')).toBe(4000)
    expect(config.get('logLevel')).toBe('debug')
    expect(config.get('allSchemaOn')).toBe(true)
    expect(config.get('disableAuth')).toBe(true)
    expect(config.get('graphqlDashboardEnabled')).toBe(true)
    expect(config.get('requestTimeoutMs')).toBe(1234)
    expect(config.get('cdp.env')).toBe('dev')
    expect(config.get('healthCheck.enabled')).toBe(false)
    expect(config.get('healthCheck.ruralPaymentsPortalEmail')).toBe('test@example.com')
    expect(config.get('healthCheck.ruralPaymentsInternalOrganisationId')).toBe('org123')
    expect(config.get('healthCheck.throttleTimeMs')).toBe(1111)
    expect(config.get('kits.requestPageSize')).toBe(50)
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
  })
})
