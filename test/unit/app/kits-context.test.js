import { describe, jest } from '@jest/globals'
import { BadRequest } from '../../../app/errors/graphql.js'

const mockJwtDecode = jest.fn()
const mockjwtModule = {
  default: { decode: mockJwtDecode }
}
jest.unstable_mockModule('jsonwebtoken', () => mockjwtModule)
const { extractOrgIdFromDefraIdToken } = await import('../../../app/graphql/context.js')

describe('extractOrgIdFromDefraIdToken', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should extract orgId when relationship matches SBI', () => {
    const sbi = '123456789'
    const token = 'mockToken'
    mockJwtDecode.mockReturnValue({
      payload: {
        relationships: ['orgId1:987654321', 'orgId2:123456789']
      }
    })

    const result = extractOrgIdFromDefraIdToken(sbi, token)
    expect(result).toBe('orgId2')
    expect(mockJwtDecode).toHaveBeenCalledWith(token, { complete: true })
  })

  test('should throw BadRequest if no relationship matches SBI', () => {
    const sbi = '000000000'
    const token = 'mockToken'
    mockJwtDecode.mockReturnValue({
      payload: {
        relationships: ['orgId1:987654321', 'orgId2:123456789']
      }
    })

    expect(() => extractOrgIdFromDefraIdToken(sbi, token)).toThrow(BadRequest)
    expect(mockJwtDecode).toHaveBeenCalledWith(token, { complete: true })
  })

  test('should throw BadRequest if relationships is missing', () => {
    const sbi = '123456789'
    const token = 'mockToken'
    mockJwtDecode.mockReturnValue({
      payload: {}
    })

    expect(() => extractOrgIdFromDefraIdToken(sbi, token)).toThrow(BadRequest)
    expect(mockJwtDecode).toHaveBeenCalledWith(token, { complete: true })
  })

  test('should throw BadRequest if relationships is not an array', () => {
    const sbi = '123456789'
    const token = 'mockToken'
    mockJwtDecode.mockReturnValue({
      payload: {
        relationships: 'not-an-array'
      }
    })

    expect(() => extractOrgIdFromDefraIdToken(sbi, token)).toThrow(BadRequest)
    expect(mockJwtDecode).toHaveBeenCalledWith(token, { complete: true })
  })
})
