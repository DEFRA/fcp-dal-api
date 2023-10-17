import appInsights from 'applicationinsights'

export function setupAppInsights () {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start()
    console.log('App Insights running')
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    appInsights.defaultClient.context.tags[cloudRoleTag] = appName
  } else {
    console.log('App Insights not running')
  }
}
