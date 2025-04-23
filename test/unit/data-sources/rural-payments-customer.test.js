import { jest } from '@jest/globals'
import { RuralPaymentsCustomer } from '../../../app/data-sources/rural-payments/RuralPaymentsCustomer.js'
import { NotFound } from '../../../app/errors/graphql.js'

describe('Rural Payments Customer', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    silly: jest.fn()
  }
  const ruralPaymentsCustomer = new RuralPaymentsCustomer({ logger })
  const httpGet = jest.spyOn(ruralPaymentsCustomer, 'get')
  const httpPost = jest.spyOn(ruralPaymentsCustomer, 'post')

  test('should handle customer not found', async () => {
    jest.useFakeTimers().setSystemTime(Date.parse('2024-09-30'))
    httpPost.mockImplementationOnce(async () => ({ _data: [] }))

    await expect(ruralPaymentsCustomer.getCustomerByCRN('11111111')).rejects.toEqual(
      new NotFound('Rural payments customer not found')
    )
    expect(httpPost).toHaveBeenCalledTimes(1)
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
    jest.useFakeTimers().setSystemTime(Date.parse('2024-09-30'))
    httpGet.mockImplementationOnce(async () => ({ notifications: [] }))

    const notifications = await ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId(
      0,
      0,
      new Date(Date.parse('2023-09-30'))
    )
    expect(notifications).toEqual([])
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('should fetch notifications from single page', async () => {
    jest.useFakeTimers().setSystemTime(Date.parse('2024-09-30'))

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
      0,
      0,
      new Date(Date.parse('2023-09-30'))
    )
    expect(notifications).toEqual([
      { id: 2, createdAt: 1698796800000 },
      { id: 1, createdAt: 1696118400000 }
    ])
    expect(httpGet).toHaveBeenCalledTimes(2)
  })

  test('should fetch notifications across pages', async () => {
    jest.useFakeTimers().setSystemTime(Date.parse('2024-09-30'))

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
      0,
      0,
      new Date(Date.parse('2023-09-30'))
    )
    expect(notifications).toEqual([
      { id: 2, createdAt: 1698796800000 },
      { id: 1, createdAt: 1696118400000 }
    ])
    expect(httpGet).toHaveBeenCalledTimes(3)
  })

  test('should stop fetching once last message found', async () => {
    jest.useFakeTimers().setSystemTime(Date.parse('2024-10-02'))

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
      0,
      0,
      new Date(Date.parse('2023-10-02'))
    )

    expect(notifications).toEqual([{ id: 2, createdAt: 1698796800000 }])
    expect(httpGet).toHaveBeenCalledTimes(1)
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
