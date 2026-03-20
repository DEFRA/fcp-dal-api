import { ConfidentialClientApplication } from '@azure/msal-node'
import { config } from '../../config.js'
import { HITACHI_API_REQUEST_001 } from '../../logger/codes.js'
import { BaseRESTDataSource } from '../BaseRESTDataSource.js'

let msalClient = null

function getMsalClient() {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.get('hitachi.entra.clientId'),
        clientSecret: config.get('hitachi.entra.clientSecret'),
        authority: `https://login.microsoftonline.com/${config.get('hitachi.entra.tenantId')}`
      }
    })
  }

  return msalClient
}

const gatewayUrl = config.get('hitachi.gatewayUrl')
export class HitachiPayments extends BaseRESTDataSource {
  constructor() {
    super(config, { name: 'Hitachi payments', code: HITACHI_API_REQUEST_001 })
    this.baseURL = gatewayUrl
  }

  async addAuthentication(request) {
    if (config.get('hitachi.disableAuth')) {
      // Send placeholder token for dev/test environments with mock services
      request.headers = {
        ...request.headers,
        Authorization: 'Bearer token'
      }
      return
    }

    try {
      const tokenResponse = await getMsalClient().acquireTokenByClientCredential({
        scopes: [`${this.baseURL}/.default`]
      })

      request.headers = {
        ...request.headers,
        Authorization: `Bearer ${tokenResponse.accessToken}`
      }
    } catch (error) {
      this.logger.error('#datasource - Hitachi payments - token acquisition failed', {
        error: error.message,
        code: HITACHI_API_REQUEST_001
      })

      throw error
    }
  }

  async getSupplierPayments(frn) {
    return this.post(
      'services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
      {
        body: {
          request: {
            payment: {
              SupplierAccount: frn
            },
            audit: {
              // TODO: add audit values
            }
          }
        }
      }
    )
  }
}
