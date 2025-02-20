import { jest } from '@jest/globals'
import { RuralPaymentsCustomer } from '../../../app/data-sources/rural-payments/RuralPaymentsCustomer.js'

jest.mock('../../../app/logger/logger.js')
const { logger } = await import('../../../app/logger/logger.js')

describe('Rural Payments Customer', () => {
  const ruralPaymentsCustomer = new RuralPaymentsCustomer({ logger })
  const httpGet = jest.spyOn(ruralPaymentsCustomer, 'get')

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
})
