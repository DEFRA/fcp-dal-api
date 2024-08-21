import { RESTDataSource } from '@apollo/datasource-rest'
import fetch from 'node-fetch'
import qs from 'qs'
import { logger } from '../../utils/logger.js'

const defaultHeaders = {
  'Ocp-Apim-Subscription-Key': process.env.RP_INTERNAL_APIM_SUBSCRIPTION_KEY,
  email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL
}

export class RuralPayments extends RESTDataSource {
  baseURL = process.env.RP_INTERNAL_APIM_URL

  async willSendRequest (_path, request) {
    if (!this.apimAccessToken) {
      logger.debug('Getting APIM access token')
      await this.getApimAccessToken()
      logger.debug('APIM access token', {
        apimAccessToken: this.apimAccessToken
      })
    }

    request.headers = {
      ...request.headers,
      ...defaultHeaders,
      Authorization: `Bearer ${this.apimAccessToken}`
    }
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
      logger.debug(
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

      this.apimAccessToken = data.access_token
    } catch (error) {
      logger.error('Error getting APIM access token', { error })
      throw error
    }
  }
}
