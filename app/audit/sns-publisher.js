import { SNSClient } from '@aws-sdk/client-sns'
import { validateAuditEvent, publishAuditEvent } from '@defra/fcp-audit-publisher'
import { config } from '../config.js'
import { DAL_AUDIT_VALIDATION_ERROR_001 } from '../logger/codes.js'

const snsClient = new SNSClient()
const topicArn = config.get('audit.sns.topicArn')

/**
 * Validates an audit event against the FCP Audit schema and, if valid, publishes it to SNS via
 * @defra/fcp-audit-publisher. Validation always runs - and a failure is always logged - even when
 * there's no topic ARN configured to publish to, so a schema-validation problem is visible
 * regardless of whether publishing itself is switched on. A publish failure (e.g. an SNS/network
 * error) is left to propagate to the caller (app/graphql/plugins/audit.js already catches and logs
 * it there, without including the event body) rather than being caught here too.
 * @param {object} event the AuditEventPayload built by app/graphql/plugins/audit.js
 * @param {object} requestLogger the per-request logger
 */
export async function snsPublish(event, requestLogger) {
  const { valid, errors } = validateAuditEvent(event)
  if (!valid) {
    // Log only the validation errors, never the event itself - it may contain PII. The winston
    // formatter (cdpSchemaTranslator) expects a single `error`, not a list, so join them into one.
    requestLogger.error('#DAL - audit event failed schema validation', {
      error: new Error(errors.join(', ')),
      code: DAL_AUDIT_VALIDATION_ERROR_001
    })
    return
  }

  if (!topicArn) {
    // Valid, but nowhere to publish to - no-op, no log (an audit event can contain PII).
    return
  }

  await publishAuditEvent(event, { snsClient, sns: { topicArn } })
}
