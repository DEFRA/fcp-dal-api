import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { RuralPaymentsCustomer } from '../../../app/data-sources/rural-payments/RuralPaymentsCustomer.js'
import { NotFound } from '../../../app/errors/graphql.js'

describe('Rural Payments Customer', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
  const datasourceOptions = [
    { logger },
    {
      gatewayType: 'internal'
    }
  ]
  const ruralPaymentsCustomer = new RuralPaymentsCustomer(...datasourceOptions)
  const ruralPaymentsCustomerExt = new RuralPaymentsCustomer(
    { logger },
    {
      gatewayType: 'external',
      request: {
        headers: {
          'x-forwarded-authorization': jwt.sign({ contactId: '11111111' }, 'secret', {
            expiresIn: '1h'
          })
        }
      }
    }
  )
  const httpGet = jest.spyOn(ruralPaymentsCustomer, 'get')
  const httpPost = jest.spyOn(ruralPaymentsCustomer, 'post')
  const httpGetExt = jest.spyOn(ruralPaymentsCustomerExt, 'get')

  test('should call getExternalPerson for external gateway', async () => {
    httpGetExt.mockImplementation(async () => ({ _data: { id: 123 } }))
    const response = await ruralPaymentsCustomerExt.getCustomerByCRN('11111111')

    expect(httpGetExt.mock.calls).toEqual([['person/3337243/summary'], ['person/3337243/summary']])
    expect(response).toEqual({ id: 123 })
  })

  test('should handle customer not found', async () => {
    httpPost.mockImplementationOnce(async () => ({ _data: [] }))

    await expect(ruralPaymentsCustomer.personSearchByCRN('11111111')).rejects.toEqual(
      new NotFound('Rural payments customer not found')
    )

    expect(httpPost).toHaveBeenCalledWith('person/search', {
      body: '{"searchFieldType":"CUSTOMER_REFERENCE","primarySearchPhrase":"11111111","offset":0,"limit":1}',
      headers: { 'Content-Type': 'application/json' }
    })
    expect(logger.warn).toHaveBeenCalledWith(
      '#datasource - Rural payments - Customer not found for CRN: 11111111',
      {
        code: 'RURALPAYMENTS_API_NOT_FOUND_001',
        crn: '11111111',
        response: { body: { _data: [] } }
      }
    )
  })

  test('should handle no notifications', async () => {
    httpGet.mockImplementationOnce(async () => ({ notifications: [] }))

    const notifications = await ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
      'mockOrganisationId',
      'mockPersonId',
      new Date(Date.parse('2023-09-30'))
    )

    expect(notifications).toEqual([])
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('should fetch notifications from single page', async () => {
    httpGet
      .mockImplementationOnce(async () => ({
        notifications: [
          {
            id: 2,
            createdAt: Date.parse('2023-11-01')
          },
          {
            id: 1,
            createdAt: Date.parse('2023-10-01')
          }
        ]
      }))
      .mockImplementationOnce(async () => ({ notifications: [] }))

    const notifications = await ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
      'mockOrganisationId',
      'mockPersonId',
      new Date(Date.parse('2023-09-30'))
    )

    expect(notifications).toEqual([
      { id: 2, createdAt: Date.parse('2023-11-01') },
      { id: 1, createdAt: Date.parse('2023-10-01') }
    ])
    expect(httpGet).toHaveBeenCalledTimes(2)
  })

  test('should fetch notifications across pages', async () => {
    httpGet
      .mockImplementationOnce(async () => ({
        notifications: [
          {
            id: 2,
            createdAt: Date.parse('2023-11-01')
          }
        ]
      }))
      .mockImplementationOnce(async () => ({
        notifications: [
          {
            id: 1,
            createdAt: Date.parse('2023-10-01')
          }
        ]
      }))
      .mockImplementationOnce(async () => ({ notifications: [] }))

    const notifications = await ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
      'mockOrganisationId',
      'mockPersonId',
      new Date(Date.parse('2023-09-30'))
    )

    expect(notifications).toEqual([
      { id: 2, createdAt: Date.parse('2023-11-01') },
      { id: 1, createdAt: Date.parse('2023-10-01') }
    ])
    expect(httpGet).toHaveBeenCalledTimes(3)
  })

  test('should stop fetching once last message found', async () => {
    httpGet.mockImplementationOnce(async () => ({
      notifications: [
        {
          id: 2,
          createdAt: Date.parse('2023-11-01')
        },
        {
          id: 1,
          createdAt: Date.parse('2023-10-01')
        }
      ]
    }))

    const notifications = await ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
      'mockOrganisationId',
      'mockPersonId',
      new Date(Date.parse('2023-10-02'))
    )

    expect(notifications).toEqual([{ id: 2, createdAt: 1698796800000 }])
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('should filter notifications using dateFrom argument', async () => {
    httpGet.mockImplementationOnce(async () => ({
      notifications: [
        { id: 3, createdAt: Date.parse('2023-12-01') },
        { id: 2, createdAt: Date.parse('2023-11-01') },
        { id: 1, createdAt: Date.parse('2023-10-01') }
      ]
    }))

    const notifications = await ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
      'mockOrganisationId',
      'mockPersonId',
      new Date(Date.parse('2023-11-01'))
    )

    expect(notifications).toEqual([{ id: 3, createdAt: Date.parse('2023-12-01') }])
  })

  test('should return security answers via getAuthenticateAnswersByCRN', async () => {
    const results = {
      memorableDate: '11/11/2000',
      memorableEvent: 'Birthday',
      memorableLocation: 'location',
      lastUpdatedOn: '2025-02-10T09:21:24.285'
    }
    httpGet.mockImplementationOnce(async () => results)

    const getAuthenticate = await ruralPaymentsCustomer.getAuthenticateAnswersByCRN(123123123)

    expect(getAuthenticate).toEqual(results)
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('should handle 204 reponse and return null via getAuthenticateAnswersByCRN', async () => {
    httpGet.mockImplementationOnce(async () => ({ status: 204, body: '' }))

    const authenticateAnswers = await ruralPaymentsCustomer.getAuthenticateAnswersByCRN(123123123)

    expect(authenticateAnswers).toEqual(null)
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('should throw error via getAuthenticateAnswersByCRN', async () => {
    httpGet.mockRejectedValue({
      extensions: { response: { status: 404 } }
    })
    await expect(ruralPaymentsCustomer.getAuthenticateAnswersByCRN(123123123)).rejects.toEqual({
      extensions: { response: { status: 404 } }
    })
    expect(httpGet).toHaveBeenCalledTimes(1)
  })
})
