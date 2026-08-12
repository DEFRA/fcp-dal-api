import {
  extractCrnFromDefraIdToken,
  extractOrgIdFromDefraIdToken
} from '../../../app/auth/defra-id.js'
import { BadRequest } from '../../../app/errors/graphql.js'
import jwt from 'jsonwebtoken'

describe('defra id', () => {
  describe('extractCrnFromDefraIdToken', () => {
    test('extracts crn successfully from valid token', async () => {
      const response = extractCrnFromDefraIdToken(
        jwt.sign({ contactId: '11111111' }, 'secret', { expiresIn: '1h' })
      )
      expect(response).toEqual('11111111')
    })
    test('Throws error when provided an invalid token', async () => {
      const invalidToken = jwt.sign({}, 'secret', { expiresIn: '1h' })
      expect(() => extractCrnFromDefraIdToken(invalidToken)).toThrow(
        new BadRequest('Defra ID token does not contain crn')
      )
    })
  })

  describe('extractOrgIdFromDefraIdToken', () => {
    test('should extract orgId when relationship matches SBI', () => {
      const sbi = '123456789'
      const token = jwt.sign(
        {
          relationships: ['orgId1:987654321', 'orgId2:123456789']
        },
        'secret',
        { expiresIn: '1h' }
      )

      const result = extractOrgIdFromDefraIdToken(sbi, token)
      expect(result).toBe('orgId2')
    })

    test('should throw BadRequest if no relationship matches SBI', () => {
      const sbi = '000000000'
      const token = jwt.sign(
        {
          relationships: ['orgId1:987654321', 'orgId2:123456789']
        },
        'secret',
        { expiresIn: '1h' }
      )

      expect(() => extractOrgIdFromDefraIdToken(sbi, token)).toThrow(BadRequest)
    })

    test('should throw BadRequest if relationships is missing', () => {
      const sbi = '123456789'
      const token = jwt.sign({}, 'secret', { expiresIn: '1h' })

      expect(() => extractOrgIdFromDefraIdToken(sbi, token)).toThrow(BadRequest)
    })

    test('should throw BadRequest if relationships is not an array', () => {
      const sbi = '123456789'
      const token = jwt.sign(
        {
          relationships: 'not-an-array'
        },
        'secret',
        { expiresIn: '1h' }
      )

      expect(() => extractOrgIdFromDefraIdToken(sbi, token)).toThrow(BadRequest)
    })
  })
})
