import fetcher from '../common/helpers/fetcher.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { getBusiness } from './get-business'

let mockInfo
jest.mock('../common/helpers/fetcher.js', () => ({ fetch: jest.fn() }))
jest.mock('../common/helpers/logging/logger.js', () => {
  mockInfo = jest.fn()
  return { createLogger: jest.fn().mockReturnValue({ info: mockInfo }) }
})

describe('getBusiness route', () => {
  let request, h

  beforeEach(() => {
    request = {
      params: {
        id: '12345'
      }
    }
    h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }
    createLogger.mockReturnValue({ info: mockInfo })
  })

  it('should fetch the business data', async () => {
    fetcher.fetch.mockResolvedValue({
      body: {
        name: 'Test Org',
        sbi: '67890',
        orgId: '12345',
        someOther: 'chuff'
      }
    })

    await getBusiness.handler(request, h)

    expect(mockInfo).toHaveBeenCalledWith('GET /get-business with params: {"id":"12345"}')
    expect(fetcher.fetch).toHaveBeenCalledWith('/organisation/12345')
    expect(mockInfo).toHaveBeenCalledWith('business object with keys: name,sbi,orgId,someOther')
    expect(h.response).toHaveBeenCalledWith({ name: 'Test Org', sbi: '67890', orgId: '12345' })
  })

  it('should handle an upstream error', async () => {
    fetcher.fetch.mockRejectedValue(new Error('some error'))

    await expect(getBusiness.handler(request, h)).rejects.toThrow(new Error('some error'))

    expect(mockInfo).toHaveBeenCalledWith('GET /get-business with params: {"id":"12345"}')
    expect(fetcher.fetch).toHaveBeenCalledWith('/organisation/12345')
  })
})
