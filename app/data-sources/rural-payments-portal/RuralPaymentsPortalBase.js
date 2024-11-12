import { RESTDataSource } from '@apollo/datasource-rest'
import { RuralPaymentsSession } from './RuralPaymentsSession.js'

const ruralPaymentsSession = new RuralPaymentsSession()

export class RuralPaymentsPortalBase extends RESTDataSource {
  baseURL = process.env.RURAL_PAYMENTS_PORTAL_API_URL

  async willSendRequest (path, request) {
    await ruralPaymentsSession.getAuthentication()
    return ruralPaymentsSession.willSendRequest(path, request)
  }
}
