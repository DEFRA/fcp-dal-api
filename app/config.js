import convict from 'convict'

export const config = convict({
  nodeEnv: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: null,
    default: 'development',
    env: 'NODE_ENV'
  },
  cdp: {
    httpsProxy: {
      doc: 'CDP HTTPS proxy, automatically set on CDP',
      format: String,
      default: null,
      sensitive: true,
      env: 'CDP_HTTPS_PROXY'
    },
    httpProxy: {
      doc: 'CDP HTTP proxy, automatically set on CDP',
      format: String,
      default: null,
      sensitive: true,
      env: 'CDP_HTTP_PROXY'
    },
    env: {
      doc: 'CDP environment, automatically set on CDP',
      format: ['dev', 'test', 'ext-test', 'perf-test', 'prod'],
      default: null,
      env: 'ENVIRONMENT'
    }
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  logLevel: {
    doc: 'The log level to use.',
    format: ['error', 'warn', 'info', 'debug'],
    default: 'info',
    env: 'LOG_LEVEL'
  },
  allSchemaOn: {
    doc: 'Enable all schema on, used for testing',
    format: Boolean,
    default: false,
    env: 'ALL_SCHEMA_ON'
  },
  disableAuth: {
    doc: 'Disable authentication, used for testing',
    format: Boolean,
    default: false,
    env: 'DISABLE_AUTH'
  },
  graphqlDashboardEnabled: {
    doc: 'Enable GraphQL dashboard',
    format: Boolean,
    default: false,
    env: 'GRAPHQL_DASHBOARD_ENABLED'
  },
  requestTimeoutMs: {
    doc: 'Timeout for DAL requests in milliseconds',
    format: 'int',
    default: null,
    env: 'DAL_REQUEST_TIMEOUT_MS'
  },
  oidc: {
    jwksURI: {
      doc: 'The URL used to validate the JWT, should be entra OIDC endpoint',
      format: String,
      default: null,
      env: 'OIDC_JWKS_URI'
    },
    timeoutMs: {
      doc: 'Timeout of OIDC request in milliseconds',
      format: 'int',
      default: null,
      env: 'OIDC_JWKS_TIMEOUT_MS'
    }
  },
  auth: {
    groups: {
      admin: {
        doc: 'AD group ID for admin users',
        format: String,
        default: null,
        env: 'ADMIN_AD_GROUP_ID'
      }
    }
  },
  healthCheck: {
    enabled: {
      doc: 'Enable health check endpoint',
      format: Boolean,
      default: true,
      env: 'HEALTH_CHECK_ENABLED'
    },
    ruralPaymentsPortalEmail: {
      doc: 'Email used for Rural Payments Portal health check',
      format: String,
      default: null,
      nullable: true,
      env: 'HEALTH_CHECK_RP_PORTAL_EMAIL'
    },
    ruralPaymentsInternalOrganisationId: {
      doc: 'Internal organisation ID used for Rural Payments Portal health check',
      format: String,
      default: null,
      nullable: true,
      env: 'HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID'
    },
    throttleTimeMs: {
      doc: 'Throttle time in milliseconds for Rural Payments Portal health check',
      format: 'int',
      default: 300000,
      env: 'HEALTH_CHECK_RP_THROTTLE_TIME_MS'
    }
  },
  kits: {
    connectionCert: {
      doc: 'Base64 encoded mTLS certificate for the KITS connection',
      format: String,
      default: null,
      sensitive: true,
      env: 'KITS_CONNECTION_CERT'
    },
    connectionKey: {
      doc: 'Base64 encoded mTLS key for the KITS connection',
      format: String,
      default: null,
      sensitive: true,
      env: 'KITS_CONNECTION_KEY'
    },
    gatewayUrl: {
      doc: 'KITS gateway internal URL',
      format: String,
      default: null,
      env: 'KITS_GATEWAY_INTERNAL_URL'
    },
    gatewayTimeoutMs: {
      doc: 'KITS gateway timeout in milliseconds',
      format: 'int',
      default: null,
      env: 'KITS_GATEWAY_TIMEOUT_MS'
    },
    requestPageSize: {
      doc: 'Enable metrics reporting',
      format: 'int',
      default: 100,
      env: 'KITS_REQUEST_PAGE_SIZE'
    }
  }
})

config.validate({ allowed: 'strict' })
