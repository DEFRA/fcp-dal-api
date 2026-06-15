import { logger } from '../../logger/logger.js'
import { healthCheck as jwks } from './jwks.js'
import { healthCheck as mongo } from './mongo.js'
import { healthCheck as ruralPayments } from './rural-payments.js'

const healthChecks = [mongo, jwks, ruralPayments]

/**
 * Runs all registered health checks.
 *
 * If a check fails, then it should log the failure at error-level and terminate the process
 */
export const runHealthChecks = async () => {
  try {
    await Promise.all(healthChecks.map((check) => check()))
  } catch (err) {
    logger.error('#DAL - unrecoverable healthcheck error, shutting down...', err)
    process.exit(1)
  }
}
