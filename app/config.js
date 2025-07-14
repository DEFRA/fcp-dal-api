import convict from 'convict'

export const config = convict({
  nodeEnv: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'production',
    env: 'NODE_ENV'
  },
  cdp: {
    httpsProxy: {
      doc: 'CDP HTTPS proxy, automatically set on CDP',
      format: String,
      default: null,
      sensitive: true,
      nullable: process.env.DISABLE_PROXY === 'true',
      env: 'CDP_HTTPS_PROXY'
    },
    httpProxy: {
      doc: 'CDP HTTP proxy, automatically set on CDP',
      format: String,
      default: null,
      sensitive: true,
      nullable: process.env.DISABLE_PROXY === 'true',
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
  disableProxy: {
    doc: 'Disable proxy for DAL requests, used for testing',
    format: Boolean,
    default: false,
    env: 'DISABLE_PROXY'
  },
  oidc: {
    jwksURI: {
      doc: 'The URL used to validate the JWT, should be entra OIDC endpoint',
      format: String,
      default: null,
      nullable: process.env.DISABLE_AUTH === 'true',
      env: 'OIDC_JWKS_URI'
    },
    timeoutMs: {
      doc: 'Timeout of OIDC request in milliseconds',
      format: 'int',
      default: null,
      nullable: process.env.DISABLE_AUTH === 'true',
      env: 'OIDC_JWKS_TIMEOUT_MS'
    }
  },
  auth: {
    groups: {
      // Note must correspond to AuthGroup Enum except admin which has access to everything
      ADMIN: {
        doc: 'AD group ID for DAL Admins',
        format: String,
        default: null,
        env: 'ADMIN_AD_GROUP_ID',
        nullable: true
      },
      CONSOLIDATED_VIEW: {
        doc: 'AD group ID for Consolidated View',
        format: String,
        default: null,
        env: 'CONSOLIDATED_VIEW_AD_GROUP_ID',
        nullable: true
      },
      SINGLE_FRONT_DOOR: {
        doc: 'AD group ID for SFD',
        format: String,
        default: null,
        env: 'SINGLE_FRONT_DOOR_AD_GROUP_ID',
        nullable: true
      }
    },
    disabled: {
      doc: 'Whether authentication is disabled, used for testing',
      format: Boolean,
      default: false,
      env: 'DISABLE_AUTH'
    }
  },
  healthCheck: {
    enabled: {
      doc: 'Enable health check endpoint',
      format: Boolean,
      default: false,
      env: 'HEALTH_CHECK_ENABLED'
    },
    ruralPaymentsPortalEmail: {
      doc: 'Email used for Rural Payments Portal health check',
      format: String,
      default: null,
      nullable: process.env.HEALTH_CHECK_ENABLED !== 'true',
      env: 'HEALTH_CHECK_RP_PORTAL_EMAIL'
    },
    ruralPaymentsInternalOrganisationId: {
      doc: 'Internal organisation ID used for Rural Payments Portal health check',
      format: String,
      default: null,
      nullable: process.env.HEALTH_CHECK_ENABLED !== 'true',
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
      nullable: process.env.KITS_DISABLE_MTLS === 'true',
      env: 'KITS_CONNECTION_CERT'
    },
    connectionKey: {
      doc: 'Base64 encoded mTLS key for the KITS connection',
      format: String,
      default: null,
      sensitive: true,
      nullable: process.env.KITS_DISABLE_MTLS === 'true',
      env: 'KITS_CONNECTION_KEY'
    },
    disableMTLS: {
      doc: 'Disables mTLS for KITS connection, used for testing',
      format: Boolean,
      default: false,
      env: 'KITS_DISABLE_MTLS'
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
