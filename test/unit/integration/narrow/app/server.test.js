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

  it('should be case and whitespace insensitive', () => {
    // hash of user@example.com
    const hashedEmail = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'
    const email = 'user@example.com'
    expect(hashEmail(email)).toBe(hashedEmail)
  })
})

describe('Server test', () => {
  it('createServer returns server', () => {
    expect(server).not.toBeUndefined()
  })
})
