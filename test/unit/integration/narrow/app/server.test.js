import { createHash } from 'crypto'
import { hashEmail, server } from '../../../../../app/server.js'

describe('hashEmail', () => {
  it('should hash an email consistently', () => {
    const email = 'Test@Example.com '
    const expectedHash = createHash('sha256').update('test@example.com').digest('hex')
    expect(hashEmail(email)).toBe(expectedHash)
  })

  it('should be case and whitespace insensitive', () => {
    const email1 = 'USER@Example.Com '
    const email2 = ' user@example.com'
    expect(hashEmail(email1)).toBe(hashEmail(email2))
  })
})

describe('Server test', () => {
  it('createServer returns server', () => {
    expect(server).not.toBeUndefined()
  })
})
