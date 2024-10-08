import { RESTDataSource } from '@apollo/datasource-rest'
import { GraphQLError } from 'graphql'
import StatusCodes from 'http-status-codes'
import fetch from 'node-fetch'
import qs from 'qs'
import { APIM_ACCESS_TOKEN_REQUEST_001, APIM_APIM_REQUEST_001, RURALPAYMENTS_API_REQUEST_001 } from '../../logger/codes.js'

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
    incomingRequest.retryCount = incomingRequest.retryCount || 1

    try {
      const result = await super.fetch(path, incomingRequest)

      return result
    } catch (error) {
      // Handle occasionally 500 error produced by APIM
      // TODO: Once APIM has been fixed, remove retry logic
      if (error?.extensions?.response?.status === StatusCodes.INTERNAL_SERVER_ERROR && incomingRequest.retryCount < maximumRetries) {
        this.logger.warn('#datasource - apim - retrying request', {
          request: {
            method: incomingRequest.method.toUpperCase(),
            path
          },
          response: {
            status: error?.extensions?.response?.status,
            headers: error?.extensions?.response?.headers.raw(),
            body: error?.extensions?.parsedBody
          },
          code: APIM_APIM_REQUEST_001
        })
        incomingRequest.retryCount++

        return this.fetch(path, incomingRequest)
      }

      throw error
    }
  }

  didEncounterError (error, request, url) {
    request.path = url
    const { response } = error.extensions

    // response is text, then the error is from RuralPayments
    const isRuralPaymentsError = response?.headers?.get('Content-Type')?.includes('text/html')

    // If response is text, then the error is from RuralPayments
    if (isRuralPaymentsError) {
      if (response?.status === StatusCodes.FORBIDDEN) {
        // If user does not have access log a warning
        this.logger.warn('#datasource - Rural payments - user does not have permission to resource', {
          request,
          code: RURALPAYMENTS_API_REQUEST_001
        })
      } else {
        this.logger.error('#datasource - Rural payments - request error', {
          error,
          request,
          response,
          code: RURALPAYMENTS_API_REQUEST_001
        })
      }
    } else {
      // if response is json, then the error is from APIM
      this.logger.error('#datasource - apim - request error', {
        error,
        request,
        response,
        code: APIM_APIM_REQUEST_001
      })
    }
  }

  async throwIfResponseIsError (options) {
    if (options.response?.ok) {
      return
    }

    const errorAsText = StatusCodes.getStatusText(options.response.status)

    throw new GraphQLError(errorAsText, {
      extensions: {
        ...options,
        response: {
          status: options.response.status,
          headers: options.response.headers,
          body: options.parsedBody
        }
      }
    })
  }

  async willSendRequest (path, request) {
    if (!this.apimAccessToken) {
      await this.getApimAccessToken()
    }

    request.headers = {
      ...request.headers,
      ...defaultHeaders,
      Authorization: `Bearer ${this.apimAccessToken}`,
      email: this.request.headers.email
    }

    this.logger.verbose('#datasource - Rural payments - request', {
      request: { ...request, path },
      code: RURALPAYMENTS_API_REQUEST_001
    })

    this.logger.verbose('#datasource - apim - request', {
      request: { ...request, path },
      code: APIM_APIM_REQUEST_001
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

    const url = `${process.env.RP_INTERNAL_APIM_ACCESS_TOKEN_URL}${process.env.RP_INTERNAL_APIM_TENANT_ID}/oauth2/v2.0/token`

    try {
      this.logger.verbose('#datasource - apim - request access token', {
        code: APIM_ACCESS_TOKEN_REQUEST_001,
        request: {
          method: 'post',
          url,
          headers,
          body
        }
      })

      const requestStart = Date.now()
      const response = await fetch(url,
        {
          method: 'post',
          body,
          headers
        }
      )
      const data = await response.json()
      const requestTimeMs = (Date.now() - requestStart)

      if (!data?.access_token?.length) {
        throw new Error('No access token returned')
      }

      this.logger.http('#datasource - apim - access token response', {
        code: APIM_ACCESS_TOKEN_REQUEST_001,
        requestTimeMs,
        request: {
          path: url,
          method: 'POST'
        },
        response: {
          status: response.status
        }
      })
      this.logger.debug('#datasource - apim - access token response', {
        request: {
          method: 'post',
          url,
          headers,
          body
        },
        response: {
          status: response.status,
          headers: response.headers.raw(),
          body: data
        },
        code: APIM_ACCESS_TOKEN_REQUEST_001,
        requestTimeMs
      })

      this.apimAccessToken = data.access_token
    } catch (error) {
      this.logger.error('#datasource - apim - access token error', {
        error,
        code: APIM_ACCESS_TOKEN_REQUEST_001
      })
      throw error
    }
  }

  // override trace function to avoid unnecessary logging
  async trace (
    path,
    request,
    fn
  ) {
    const requestStart = Date.now()
    const result = await fn()
    const requestTimeMs = (Date.now() - requestStart)

    const response = {
      status: result.response?.status,
      headers: result.response?.headers.raw(),
      body: result.response?.body
    }

    this.logger.http('#datasource - Rural payments - response', {
      code: RURALPAYMENTS_API_REQUEST_001,
      requestTimeMs,
      request: { ...request, path },
      response: { statusCode: request.response?.status }
    })
    this.logger.debug('#datasource - Rural payments - response detail', {
      request: { ...request, path },
      response: { ...response, body: result.parsedBody },
      code: RURALPAYMENTS_API_REQUEST_001,
      requestTimeMs
    })

    this.logger.http('#datasource - apim - response', {
      code: APIM_APIM_REQUEST_001,
      requestTimeMs,
      request: { ...request, path },
      response: { status: result.response?.status }
    })
    // console.log(response)
    // const parsedBody = await this.parseBody(result.parsedBody)
    this.logger.debug('#datasource - apim - response detail', {
      request: { ...request, path },
      response: { ...response, body: result.parsedBody },
      code: APIM_APIM_REQUEST_001,
      requestTimeMs
    })

    return result
  }

  // ensure that the same request is not sent twice
  requestDeduplicationPolicyFor (url, request) {
    const method = request.method ?? 'GET'
    const cacheKey = this.cacheKeyFor(url, request)
    const requestId = request.id
    return {
      policy: 'deduplicate-during-request-lifetime',
      deduplicationKey: `${requestId} ${method} ${cacheKey}`
    }
  }
}
