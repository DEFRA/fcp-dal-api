import { healthCheck as mongo } from './mongo.js'

const healthChecks = [mongo]

/**
 * Runs all registered health checks.
 *
 * If a check fails, then it should log the failure at error-level and terminate the process
 */
export const runHealthChecks = async () => {
  for (const healthCheck of healthChecks) {
    await healthCheck()
  }
}
