import appInsights from 'applicationinsights'
import { logger } from './logger/logger.js'

export function setupAppInsights() {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start()
    logger.info('App Insights running')
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    appInsights.defaultClient.context.tags[cloudRoleTag] = appName
  } else {
    logger.info('App Insights not running')
  }
}
