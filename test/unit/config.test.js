import { jest } from '@jest/globals'

describe('config', () => {
  describe('ruralPayments.portalUrl', () => {
    const originalEnv = process.env

    const importConfig = async () => {
      jest.resetModules()
      const { config } = await import('../../app/config.js')
      return config
    }

    beforeEach(() => {
      process.env = { ...originalEnv }
      delete process.env.CUSTOMER_EMAILS_DISABLED
      delete process.env.RURAL_PAYMENTS_PORTAL_URL
    })

    afterEach(() => {
      process.env = originalEnv
    })

    test('is optional when customer emails are enabled', async () => {
      const config = await importConfig()

      expect(config.get('ruralPayments.portalUrl')).toBeNull()
    })

    test('is required when customer emails are disabled', async () => {
      process.env.CUSTOMER_EMAILS_DISABLED = 'true'

      await expect(importConfig()).rejects.toThrow('ruralPayments.portalUrl')
    })

    test('is read from the environment when customer emails are disabled', async () => {
      process.env.CUSTOMER_EMAILS_DISABLED = 'true'
      process.env.RURAL_PAYMENTS_PORTAL_URL = 'https://rural-payments.example.com'

      const config = await importConfig()

      expect(config.get('ruralPayments.portalUrl')).toBe('https://rural-payments.example.com')
    })
  })
})
