import { snsPublish } from '../../audit/sns-publisher.js'
import { config } from '../../config.js'
import { DAL_HEALTH_CHECK_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

const APPLICATION = 'Data Access Layer'
const COMPONENT = 'fcp-dal-api'
const AUDIT_EVENT_SCHEMA_VERSION = '1.0.0'

export const healthCheck = async () => {
  if (!config.get('audit.sns.topicArn')) {
    return
  }

  const event = {
    version: AUDIT_EVENT_SCHEMA_VERSION,
    user: 'DAL start-up healthcheck',
    ip: '127.0.0.1',
    correlationid: 'DAL-startup-healthcheck',
    datetime: new Date().toISOString(),
    environment: config.get('cdp.env') ? `cdp-${config.get('cdp.env')}` : 'local',
    application: APPLICATION,
    component: COMPONENT,
    audit: {
      status: 'success',
      entities: [{ entity: 'audit', action: 'created', entityid: 'DAL start-up healthcheck' }],
      details: {
        requestBody: '{}',
        rootField: 'startup',
        sourceSystem: null,
        sourceSystemSecurityGroupId: null,
        errorDetails: [],
        serviceAccount: null
      }
    }
  }

  try {
    await snsPublish(event, logger)
    logger.info('SUCCESS: Published startup audit event to SNS')
  } catch (error) {
    logger.error('#DAL - Error publishing startup audit event', {
      error,
      code: DAL_HEALTH_CHECK_001
    })
    throw error
  }
}
