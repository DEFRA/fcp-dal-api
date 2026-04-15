import { ConfidentialClientApplication } from '@azure/msal-node'
import { StatusCodes } from 'http-status-codes'
import { config as appConfig } from '../../config.js'
import { HttpError, NotFound } from '../../errors/graphql.js'
import { HITACHI_API_NOT_FOUND_001, HITACHI_API_REQUEST_001 } from '../../logger/codes.js'
import { BaseRESTDataSource } from '../BaseRESTDataSource.js'

const baseUrl = appConfig.get('hitachi.baseUrl')

const clientApplicationConfiguration = {
  auth: {
    clientId: appConfig.get('hitachi.entra.clientId'),
    clientSecret: appConfig.get('hitachi.entra.clientSecret'),
    authority: `https://login.microsoftonline.com/${appConfig.get('hitachi.entra.tenantId')}`
  }
}

const clientCredentialRequest = {
  scopes: [`${baseUrl}/.default`]
}

let msalClient = null

function getMsalClient() {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication(clientApplicationConfiguration)
  }

  return msalClient
}

export class HitachiPayments extends BaseRESTDataSource {
  constructor(config) {
    super(config, { name: 'Hitachi payments', code: HITACHI_API_REQUEST_001 })
    this.baseURL = baseUrl
    this.audit = config.audit
  }

  async addAuthentication(request) {
    if (appConfig.get('hitachi.disableAuth')) {
      request.headers = {
        ...request.headers,
        Authorization: 'Bearer token'
      }
    } else {
      try {
        const tokenResponse =
          await getMsalClient().acquireTokenByClientCredential(clientCredentialRequest)

        request.headers = {
          ...request.headers,
          Authorization: `Bearer ${tokenResponse.accessToken}`
        }
      } catch (error) {
        this.logger.error('#datasource - Hitachi payments - token acquisition failed', {
          code: HITACHI_API_REQUEST_001
        })

        throw error
      }
    }
  }

  async getSupplierPayments({ frn, fromDate, toDate, userIP, resourceId }) {
    // Validate client-provided values
    if (!userIP) {
      throw new HttpError(StatusCodes.UNPROCESSABLE_ENTITY, {
        extensions: {
          message: 'Missing required value: userIP'
        }
      })
    }

    // Validate server-provided audit values
    const serverAuditValues = {
      ...this.audit,
      resourceId
    }

    const missingServerValues = [
      'requestedSystem',
      'requesterId',
      'correlationId',
      'resourceId'
    ].filter((key) => !serverAuditValues[key])

    if (missingServerValues.length > 0) {
      this.logger.error(
        `#datasource - Hitachi payments - missing server-side audit values: ${missingServerValues.join(', ')}`,
        {
          code: HITACHI_API_REQUEST_001
        }
      )

      throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, {
        extensions: {
          message: 'Internal server error'
        }
      })
    }

    const paymentRequest = {
      SupplierAccount: frn
    }

    if (fromDate) {
      paymentRequest.FromDate = fromDate.toISOString()
    }

    if (toDate) {
      paymentRequest.ToDate = toDate.toISOString()
    }

    const response = await this.post(
      '/api/services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
      {
        body: {
          request: {
            payment: paymentRequest,
            audit: {
              ...serverAuditValues,
              userIP
            }
          }
        }
      }
    )

    // Check for Hitachi-specific "not found" response
    if (response.Result === false) {
      this.logger.warn(`#datasource - Hitachi payments - business not found with FRN ${frn}`, {
        code: HITACHI_API_NOT_FOUND_001
      })
      throw new NotFound('Hitachi payments business not found')
    }

    return response
  }
}
