/*
 * RuralPaymentsSession
 * A class used to maintain an active authenticated session with with the Rural Payments Portal
 */

import { RESTDataSource } from '@apollo/datasource-rest'
import { HttpsProxyAgent } from 'https-proxy-agent'
import qs from 'qs'
import { CookieJar } from 'tough-cookie'
import { URL } from 'url'
import { logger } from '../../logger/logger.js'

const defaultHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  Host: new URL(process.env.RURAL_PAYMENTS_PORTAL_API_URL).hostname,
  Origin: process.env.RURAL_PAYMENTS_PORTAL_API_URL.slice(0, -1),
  Referer: `${process.env.RURAL_PAYMENTS_PORTAL_API_URL}login`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  Accept: '*/*',
  Connection: 'keep-alive'
}

const apiCredentials = {
  email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL,
  password: process.env.RURAL_PAYMENTS_PORTAL_PASSWORD
}

export class RuralPaymentsSession extends RESTDataSource {
  baseURL = process.env.RURAL_PAYMENTS_PORTAL_API_URL

  constructor () {
    super(...arguments)

    this.jar = new CookieJar()
  }

  willSendRequest (path, request) {
    if (process.env.RURAL_PAYMENTS_PORTAL_PROXY_URL) {
      request.agent = new HttpsProxyAgent(
        process.env.RURAL_PAYMENTS_PORTAL_PROXY_URL
      )
    }

    request.headers = {
      ...request.headers,
      ...defaultHeaders
    }

    const xsrfToken = this.getCookie('XSRF-TOKEN')
    if (xsrfToken) {
      request.headers['X-XSRF-TOKEN'] = xsrfToken
    }

    const cookie = this.jar.getCookieStringSync(
      `${request.headers.Origin}/${path}`
    )
    if (cookie.length) {
      request.headers.Cookie = cookie
    }

    // manually handle redirects so we can apply the headers to each redirect request
    request.redirect = 'manual'

    return request
  }

  setCookies (path, response) {
    let cookies = response.headers.raw()['set-cookie']
    if (cookies) {
      if (!Array.isArray(cookies)) {
        cookies = [cookies]
      }
      cookies.forEach(cookie => {
        this.jar.setCookieSync(
          cookie,
          `${process.env.RURAL_PAYMENTS_PORTAL_API_URL}`
        )
      })
    }
  }

  async handleRedirects (response) {
    if ([301, 302, 303].includes(response?.status)) {
      const redirectUrl = new URL(response.headers.get('location'))
      logger.verbose('#RuralPaymentsSession - handle redirect', {
        status: response?.status,
        redirect: redirectUrl.pathname
      })
      return this.get(redirectUrl.pathname.replace('/', ''))
    }
  }

  async throwIfResponseIsError (options) {
    const { response } = options
    if (response?.status < 400) {
      return
    }
    logger.error('#RuralPaymentsSession - error', {
      status: response?.status,
      url: response?.url,
      error: response?.error
    })
    throw await this.errorFromResponse(options)
  }

  async fetch (path, incomingRequest) {
    logger.verbose('#RuralPaymentsSession - new request ', {
      path,
      method: incomingRequest.method,
      cookies: this.jar
        .toJSON()
        .cookies.map(cookie => cookie.key)
        .join(', ')
    })
    const result = await super.fetch(path, incomingRequest)
    logger.verbose('#RuralPaymentsSession - response ', {
      path,
      status: result.response?.status,
      body: result.response.parsedBody,
      redirect: result.response?.headers?.get('location')
    })
    this.setCookies(path, result.response)
    await this.handleRedirects(result.response)
    return result
  }

  async getCSRFToken () {
    const csrfResponse = await this.get('login')
    return csrfResponse
      .match(/(?<=name="csrfToken" value=")(.*)(?="\/>)/g)
      .pop()
  }

  getCookie (name) {
    const cookies = this.jar.toJSON()
    const foundCookie = cookies.cookies.find(cookie => cookie.key === name)

    return foundCookie?.value
  }

  async initiateAuthenticatedSession () {
    let validSession = await this.hasValidSession()

    if (!validSession) {
      const body = qs.stringify({
        email: apiCredentials.email,
        password: apiCredentials.password,
        csrfToken: await this.getCSRFToken()
      })

      const authenticateResponse = await this.post('login', {
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      })

      // There is another session active, expire it and retry the authentication
      const expireSession = authenticateResponse.match(/Session exists/g)
      if (expireSession) {
        const currentTimestamp = Date.now()
        await this.get(
          `expire_user_session/${encodeURIComponent(
            apiCredentials.email
          )}?_${currentTimestamp}`
        )
        return this.initiateAuthenticatedSession()
      }

      // Check if the session is now valid
      validSession = await this.hasValidSession()
      if (!validSession) {
        throw new Error('Unable to get valid session')
      }
    }
  }

  async hasValidSession () {
    try {
      await this.get('api/person/context')
      return true
    } catch (error) {
      return false
    }
  }

  async getAuthentication () {
    if (this.onAuthPromise) {
      return this.onAuthPromise
    }

    const initiateSession = async (resolve, reject) => {
      try {
        await this.initiateAuthenticatedSession()
        resolve()
      } catch (error) {
        logger.error('#RuralPaymentsSession - Error initiating session', {
          error
        })
        reject(error)
      } finally {
        this.onAuthPromise = null
      }
    }

    this.onAuthPromise = new Promise(initiateSession)

    return this.onAuthPromise
  }

  requestDeduplicationPolicyFor () {
    return { policy: 'do-not-deduplicate' }
  }
}
