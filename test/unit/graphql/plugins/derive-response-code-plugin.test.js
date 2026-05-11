import { deriveResponseCodePlugin } from '../../../../app/graphql/plugins/derive-response-code-plugin.js'

const makeResponse = (singleResult) => ({
  body: { singleResult },
  http: {}
})

describe('deriveResponseCodePlugin', () => {
  let handler

  beforeEach(async () => {
    handler = await deriveResponseCodePlugin.requestDidStart()
  })

  describe('partial response — errors and resolved data', () => {
    it('sets status 206 when errors and resolved data are both present', async () => {
      const response = makeResponse({
        errors: [{ message: 'err' }],
        data: { customer: { name: 'Alice' } }
      })
      await handler.willSendResponse({ response })
      expect(response.http.status).toBe(206)
    })
  })

  describe('errors only — no resolved data', () => {
    it('does not set status when errors are present but data has no resolved values', async () => {
      const response = makeResponse({ errors: [{ message: 'err' }], data: null })
      await handler.willSendResponse({ response })
      expect(response.http.status).toBeUndefined()
    })
  })

  describe('success — no errors', () => {
    it('does not set status when there are no errors and data is present', async () => {
      const response = makeResponse({ data: { customer: { name: 'Alice' } } })
      await handler.willSendResponse({ response })
      expect(response.http.status).toBeUndefined()
    })

    it('does not set status when there are no errors and no data', async () => {
      const response = makeResponse({ data: null })
      await handler.willSendResponse({ response })
      expect(response.http.status).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('does not throw and does not set status when singleResult is absent', async () => {
      const response = { body: {}, http: {} }
      await expect(handler.willSendResponse({ response })).resolves.not.toThrow()
      expect(response.http.status).toBeUndefined()
    })
  })
})
