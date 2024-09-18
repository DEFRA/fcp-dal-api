import { RESTDataSource } from '@apollo/datasource-rest'
import { GraphQLError } from 'graphql'
import StatusCodes from 'http-status-codes'
import fetch from 'node-fetch'
import qs from 'qs'
import { APIM_REQUEST_ACCESS_TOKEN_001, APIM_REQUEST_RURAL_PAYMENTS_REQUEST_001, RURALPAYMENTS_REQUEST_ALL_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

const defaultHeaders = {
  'Ocp-Apim-Subscription-Key': process.env.RP_INTERNAL_APIM_SUBSCRIPTION_KEY
}
const maximumRetries = 3

export class RuralPayments extends RESTDataSource {
  baseURL = process.env.RP_INTERNAL_APIM_URL
  request = null

  constructor (config, request) {
    super(config)

    this.request = request
  }

  async fetch (path, incomingRequest) {
    logger.verbose('#RuralPayments - new request', {
      path,
      method: incomingRequest.method
    })

    const doRequest = async (count = 1) => {
      try {
        const requestStart = Date.now()
        const result = await super.fetch(path, incomingRequest)
        const requestEnd = (Date.now() - requestStart)
        logger.verbose('#RuralPayments - response ', {
          path,
          status: result.response?.status
        })
        logger.health('#RuralPayments - request success', {
          code: RURALPAYMENTS_REQUEST_ALL_001,
          requestTimeMs: requestEnd
        })
        logger.health('#APIM - request success', {
          code: APIM_REQUEST_RURAL_PAYMENTS_REQUEST_001
        })
        return result
      } catch (error) {
        // Handle occasionally 500 error produced by APIM
        // TODO: Once APIM has been fixed, remove retry logic
        if (error?.extensions?.response?.status === StatusCodes.INTERNAL_SERVER_ERROR && count < maximumRetries) {
          logger.warn(`#RuralPayments - Error, Retrying request (${count})`, { error })
          return doRequest(count + 1)
        }
        // if response is text, then the error is from RoralPayments
        if (error?.extensions?.response?.headers?.get('Content-Type')?.includes('text/html')) {
          logger.error('#RuralPayments - error', {
            error,
            path,
            method: incomingRequest.method,
            count,
            response: error?.extensions?.response,
            code: RURALPAYMENTS_REQUEST_ALL_001
          })
        } else {
        // if response is json, then the error is from APIM
          logger.error('#APIM - error', {
            error,
            path,
            method: incomingRequest.method,
            count,
            response: error?.extensions?.response,
            code: APIM_REQUEST_RURAL_PAYMENTS_REQUEST_001
          })
        }
        throw error
      }
    }

    return doRequest()
  }

  async throwIfResponseIsError (options) {
    const { response } = options
    if (response.ok) {
      return
    }

    throw new GraphQLError(`${options.response.status}: ${options.response.statusText}`, {
      extensions: options
    })
  }

  async willSendRequest (_path, request) {
    if (!this.apimAccessToken) {
      logger.verbose('Getting APIM access token')
      await this.getApimAccessToken()
      logger.verbose('APIM access token', {
        apimAccessToken: this.apimAccessToken
      })
    }

    request.headers = {
      ...request.headers,
      ...defaultHeaders,
      Authorization: `Bearer ${this.apimAccessToken}`,
      email: this.request.headers.email
    }

    logger.debug('Request headers for rural payments', {
      headers: request.headers
    })
  }

  async getApimAccessToken () {
    const body = qs.stringify({
      grant_type: 'client_credentials',
      scope: process.env.RP_INTERNAL_APIM_SCOPE
    })

    const basicAuthHeader = Buffer.from(
      `${process.env.RP_INTERNAL_APIM_CLIENT_ID}:${process.env.RP_INTERNAL_APIM_CLIENT_SECRET}`
    ).toString('base64')
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Ocp-Apim-Subscription-Key':
        process.env.RP_INTERNAL_APIM_SUBSCRIPTION_KEY,
      Authorization: `Basic ${basicAuthHeader}`
    }

    try {
      logger.verbose(
        `Token request url: ${process.env.RP_INTERNAL_APIM_ACCESS_TOKEN_URL}${process.env.RP_INTERNAL_APIM_TENANT_ID}/oauth2/v2.0/token`
      )
      const response = await fetch(
        `${process.env.RP_INTERNAL_APIM_ACCESS_TOKEN_URL}${process.env.RP_INTERNAL_APIM_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'post',
          body,
          headers
        }
      )
      const data = await response.json()
      logger.debug('Token request response', { data })

      if (!data?.access_token?.length) {
        throw new Error('No access token returned')
      }

      logger.health('Successfully got APIM access token', { code: APIM_REQUEST_ACCESS_TOKEN_001 })
      this.apimAccessToken = data.access_token
    } catch (error) {
      logger.error('Error getting APIM access token', { error, code: APIM_REQUEST_ACCESS_TOKEN_001 })
      throw error
    }
  }
}
