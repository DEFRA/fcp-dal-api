import { partialResponsePlugin } from '../../../../app/graphql/plugins/partial-response-plugin.js'

const makeResponse = (extensions) => ({
  http: { status: undefined },
  body: { singleResult: { extensions } }
})

const simulateResolver = (executionHandler, resolvedFieldResponse = null) => {
  const willResolveFieldResponseFunction = executionHandler.willResolveField()
  willResolveFieldResponseFunction(resolvedFieldResponse)
}

const simulateResolverSuccess = (executionHandler) => {
  simulateResolver(executionHandler)
}

const simulateResolverFailure = (executionHandler) => {
  simulateResolver(executionHandler, new Error('upstream error'))
}

describe('partialResponsePlugin', () => {
  let requestHandler
  let executionHandler

  beforeEach(async () => {
    requestHandler = await partialResponsePlugin.requestDidStart()
    executionHandler = await requestHandler.executionDidStart()
  })

  describe('partial response — mixed resolver outcomes', () => {
    it('sets http status 206 and partialResponse true when at least one resolver succeeded and one failed', async () => {
      simulateResolverSuccess(executionHandler)
      simulateResolverFailure(executionHandler)
      const response = makeResponse()
      await requestHandler.willSendResponse({ response })
      expect(response.http.status).toBe(206)
      expect(response.body.singleResult.extensions.partialResponse).toBe(true)
    })

    it('sets http status 206 and partialResponse true with multiple successes and one failure', async () => {
      simulateResolverSuccess(executionHandler)
      simulateResolverSuccess(executionHandler)
      simulateResolverFailure(executionHandler)
      const response = makeResponse()
      await requestHandler.willSendResponse({ response })
      expect(response.http.status).toBe(206)
      expect(response.body.singleResult.extensions.partialResponse).toBe(true)
    })

    it('preserves existing extensions when setting partialResponse', async () => {
      simulateResolverSuccess(executionHandler)
      simulateResolverFailure(executionHandler)
      const response = makeResponse({ traceId: 'abc-123' })
      await requestHandler.willSendResponse({ response })
      expect(response.body.singleResult.extensions).toEqual({
        traceId: 'abc-123',
        partialResponse: true
      })
    })
  })

  describe('all resolvers failed', () => {
    it('does not set http status and sets partialResponse false when all resolvers failed', async () => {
      simulateResolverFailure(executionHandler)
      simulateResolverFailure(executionHandler)
      simulateResolverFailure(executionHandler)
      const response = makeResponse()
      await requestHandler.willSendResponse({ response })
      expect(response.http.status).toBeUndefined()
      expect(response.body.singleResult.extensions.partialResponse).toBe(false)
    })
  })

  describe('all resolvers succeeded', () => {
    it('does not set http status and sets partialResponse false when all resolvers succeeded', async () => {
      simulateResolverSuccess(executionHandler)
      simulateResolverSuccess(executionHandler)
      const response = makeResponse()
      await requestHandler.willSendResponse({ response })
      expect(response.http.status).toBeUndefined()
      expect(response.body.singleResult.extensions.partialResponse).toBe(false)
    })
  })

  describe('no resolvers executed', () => {
    it('does not set http status and sets partialResponse false when no resolvers ran', async () => {
      const response = makeResponse()
      await requestHandler.willSendResponse({ response })
      expect(response.http.status).toBeUndefined()
      expect(response.body.singleResult.extensions.partialResponse).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('does not throw when singleResult is absent', async () => {
      simulateResolverSuccess(executionHandler)
      simulateResolverFailure(executionHandler)
      const response = { http: {}, body: {} }
      await expect(requestHandler.willSendResponse({ response })).resolves.not.toThrow()
    })
  })
})
