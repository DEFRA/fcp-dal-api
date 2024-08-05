import { RESTDataSource } from '@apollo/datasource-rest'
import fetch from 'node-fetch'
import qs from 'qs'
import logger from '../../utils/logger.js'

const defaultHeaders = {
  'Ocp-Apim-Subscription-Key': process.env.VERSION_ONE_APIM_SUBSCRIPTION_KEY,
  email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL
}

export class VersionOne extends RESTDataSource {
  baseURL = process.env.VERSION_ONE_API_URL

  async willSendRequest (path, request) {
    if (!this.apimAccessToken) {
      logger.debug('Getting APIM access token')
      await this.getApimAccessToken()
      logger.debug('APIM access token', { apimAccessToken: this.apimAccessToken })
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
      scope: process.env.VERSION_ONE_APIM_SCOPE
    })

    const basicAuthHeader = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Ocp-Apim-Subscription-Key': process.env.VERSION_ONE_APIM_SUBSCRIPTION_KEY,
      Authorization: `Basic ${basicAuthHeader}`
    }

    try {
      const response = await fetch(`${process.env.VERSION_ONE_APIM_ACCESS_TOKEN_URL}${process.env.API_TENANT_ID}/oauth2/v2.0/token`, {
        method: 'post',
        body,
        headers
      })
      const data = await response.json()

      if (!data || !data.access_token || !data.access_token.length) {
        throw new Error('No access token returned')
      }

      this.apimAccessToken = data.access_token
    } catch (error) {
      logger.error('Error getting APIM access token', { error })
      throw error
    }
  }
}
