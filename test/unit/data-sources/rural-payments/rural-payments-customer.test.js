import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { RuralPaymentsCustomer } from '../../../../app/data-sources/rural-payments/RuralPaymentsCustomer.js'
import { BadRequest, NotFound } from '../../../../app/errors/graphql.js'

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

  test('should call getExternalPerson for external gateway ignoring specified CRN', async () => {
    httpGetExt.mockImplementation(async () => ({ _data: { id: 123 } }))
    const response = await ruralPaymentsCustomerExt.getCustomerByCRN('ignored-crn')

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

  test('should post person search request with pagination and return data and page', async () => {
    const mockResponse = {
      _data: [{ id: 123, fullName: 'John Smith' }],
      _page: { number: 2, size: 20, totalPages: 3, numberOfElements: 1, totalElements: 41 }
    }
    httpPost.mockImplementationOnce(async () => mockResponse)

    const result = await ruralPaymentsCustomer.personSearch('CUSTOMER_NAME', 'Smith', {
      page: 2,
      perPage: 20
    })

    expect(result).toEqual({ data: mockResponse._data, page: mockResponse._page })
    expect(httpPost).toHaveBeenCalledWith('person/search', {
      body: '{"searchFieldType":"CUSTOMER_NAME","primarySearchPhrase":"Smith","offset":20,"limit":20}',
      headers: { 'Content-Type': 'application/json' }
    })
  })

  test('should default person search pagination and return empty data when no results', async () => {
    const mockResponse = {
      _data: [],
      _page: { number: 1, size: 100, totalPages: 0, numberOfElements: 0, totalElements: 0 }
    }
    httpPost.mockImplementationOnce(async () => mockResponse)

    const result = await ruralPaymentsCustomer.personSearch('CUSTOMER_POSTCODE', 'AB12 3CD')

    expect(result).toEqual({ data: [], page: mockResponse._page })
    expect(httpPost).toHaveBeenCalledWith('person/search', {
      body: '{"searchFieldType":"CUSTOMER_POSTCODE","primarySearchPhrase":"AB12 3CD","offset":0,"limit":100}',
      headers: { 'Content-Type': 'application/json' }
    })
  })

  test('should default person search page only when perPage provided without page', async () => {
    httpPost.mockImplementationOnce(async () => ({ _data: [], _page: undefined }))

    await ruralPaymentsCustomer.personSearch('CUSTOMER_NAME', 'Smith', { perPage: 25 })

    expect(httpPost).toHaveBeenCalledWith('person/search', {
      body: '{"searchFieldType":"CUSTOMER_NAME","primarySearchPhrase":"Smith","offset":0,"limit":25}',
      headers: { 'Content-Type': 'application/json' }
    })
  })

  test('should default person search perPage only when page provided without perPage', async () => {
    httpPost.mockImplementationOnce(async () => ({ _data: [], _page: undefined }))

    await ruralPaymentsCustomer.personSearch('CUSTOMER_NAME', 'Smith', { page: 3 })

    expect(httpPost).toHaveBeenCalledWith('person/search', {
      body: '{"searchFieldType":"CUSTOMER_NAME","primarySearchPhrase":"Smith","offset":200,"limit":100}',
      headers: { 'Content-Type': 'application/json' }
    })
  })

  test('should return empty data and undefined page when person search response is empty', async () => {
    httpPost.mockImplementationOnce(async () => undefined)

    const result = await ruralPaymentsCustomer.personSearch('CRN', '1234567890')

    expect(result).toEqual({ data: [], page: undefined })
  })

  test('should map CRN search type to the CUSTOMER_REFERENCE field expected by KITS', async () => {
    httpPost.mockImplementationOnce(async () => ({ _data: [], _page: undefined }))

    await ruralPaymentsCustomer.personSearch('CRN', '1234567890')

    expect(httpPost).toHaveBeenCalledWith('person/search', {
      body: '{"searchFieldType":"CUSTOMER_REFERENCE","primarySearchPhrase":"1234567890","offset":0,"limit":100}',
      headers: { 'Content-Type': 'application/json' }
    })
  })

  test('should throw BadRequest when person search page is less than 1', async () => {
    await expect(
      ruralPaymentsCustomer.personSearch('CUSTOMER_NAME', 'Smith', { page: 0, perPage: 20 })
    ).rejects.toEqual(new BadRequest('Pagination page must be 1 or greater'))

    expect(httpPost).not.toHaveBeenCalled()
  })

  test('should throw BadRequest when person search perPage is less than 1', async () => {
    await expect(
      ruralPaymentsCustomer.personSearch('CUSTOMER_NAME', 'Smith', { page: 1, perPage: 0 })
    ).rejects.toEqual(new BadRequest('Pagination perPage must be 1 or greater'))

    expect(httpPost).not.toHaveBeenCalled()
  })

  test('should throw an error from getPersonByPersonId when customer not found', async () => {
    httpGet.mockImplementationOnce(async () => ({}))

    await expect(ruralPaymentsCustomer.getPersonByPersonId('nonexistentId')).rejects.toEqual(
      new NotFound('Rural payments customer not found')
    )

    expect(httpGet).toHaveBeenCalledWith('person/nonexistentId/summary')
    expect(logger.warn).toHaveBeenCalledWith(
      '#datasource - Rural payments - Customer not found for Person ID: nonexistentId',
      {
        code: 'RURALPAYMENTS_API_NOT_FOUND_001',
        personId: 'nonexistentId',
        response: { body: {} },
        gatewayType: 'internal',
        request: undefined
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
