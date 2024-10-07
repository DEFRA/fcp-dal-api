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
    const request = {
      method: incomingRequest.method.toUpperCase(),
      path,
      payload: incomingRequest.body,
      headers: incomingRequest.headers
    }

    const doRequest = async (count = 1) => {
      try {
        this.logger.verbose('#datasource - Rural payments - request', {
          request,
          code: RURALPAYMENTS_API_REQUEST_001
        })

        this.logger.verbose('#datasource - apim - request', {
          request,
          code: APIM_APIM_REQUEST_001
        })

        const requestStart = Date.now()
        const result = await super.fetch(path, incomingRequest)
        const requestTimeMs = (Date.now() - requestStart)

        this.logger.http('#datasource - Rural payments - response', {
          code: RURALPAYMENTS_API_REQUEST_001,
          requestTimeMs,
          request: {
            path: request.path,
            method: request.method.toUpperCase(),
            headers: request.headers
          },
          response: {
            statusCode: request.response?.status
          }
        })
        this.logger.debug('#datasource - Rural payments - response', {
          request,
          response: {
            status: result.response?.status,
            headers: result.response?.headers,
            body: result.response?.body
          },
          code: RURALPAYMENTS_API_REQUEST_001,
          requestTimeMs
        })

        this.logger.http('#datasource - Rural payments - response', {
          code: APIM_APIM_REQUEST_001,
          requestTimeMs,
          request: {
            path: request.path,
            method: request.method.toUpperCase()
          },
          response: {
            status: result.response?.status,
            headers: result.response?.headers,
            body: result.response?.body
          }
        })
        this.logger.debug('#datasource - apim - response', {
          request,
          response: {
            status: result.response?.status,
            headers: result.response?.headers,
            body: result.response?.body
          },
          code: APIM_APIM_REQUEST_001,
          requestTimeMs
        })

        return result
      } catch (error) {
        // Handle occasionally 500 error produced by APIM
        // TODO: Once APIM has been fixed, remove retry logic
        if (error?.extensions?.response?.status === StatusCodes.INTERNAL_SERVER_ERROR && count < maximumRetries) {
          this.logger.warn('#datasource - apim - retrying request', { request, error, code: APIM_APIM_REQUEST_001, retryCount: count })
          return doRequest(count + 1)
        }

        // If response is text, then the error is from RuralPayments
        if (error?.extensions?.response?.headers?.get('Content-Type')?.includes('text/html')) {
          if (error?.extensions?.response?.status === StatusCodes.FORBIDDEN) {
            // If user does not have access log a warning
            this.logger.warn('#datasource - Rural payments - user does not have permission to resource', {
              request,
              error,
              code: RURALPAYMENTS_API_REQUEST_001
            })
          } else {
            this.logger.error('#datasource - Rural payments - request error', {
              error,
              request,
              retryCount: count,
              response: error?.extensions?.response,
              code: RURALPAYMENTS_API_REQUEST_001
            })
          }
        } else {
          // if response is json, then the error is from APIM
          this.logger.error('#datasource - apim - request error', {
            error,
            request,
            retryCount: count,
            response: error?.extensions?.response,
            code: APIM_APIM_REQUEST_001
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

    this.logger.silly('#datasource - Rural payments - add headers', { headers: request.headers, path })
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
          headers: response.headers,
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
    _url,
    _request,
    fn
  ) {
    return fn()
  }

  // ensure that the same request is not sent twice
  // requestDeduplicationPolicyFor (url, request) {
  //   const method = request.method ?? 'GET'
  //   const cacheKey = this.cacheKeyFor(url, request)
  //   return {
  //     policy: 'deduplicate-during-request-lifetime',
  //     deduplicationKey: `${method} ${cacheKey}`
  //   }
  // }
}
