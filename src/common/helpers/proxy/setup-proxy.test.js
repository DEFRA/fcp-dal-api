import { config } from '../../../config.js'
import { getGlobalDispatcher, ProxyAgent } from 'undici'
import { setupProxy } from './setup-proxy.js'

describe('setupProxy', () => {
  afterEach(() => {
    config.set('httpProxy', null)
  })

  test('Should not setup proxy if the environment variable is not set', () => {
    config.set('httpProxy', null)
    setupProxy()

    expect(global?.GLOBAL_AGENT?.HTTP_PROXY).toBeUndefined()

    const undiciDispatcher = getGlobalDispatcher()

    expect(undiciDispatcher).not.toBeInstanceOf(ProxyAgent)
  })

  test('Should setup proxy if the environment variable is set', () => {
    config.set('httpProxy', 'http://localhost:8080')
    setupProxy()
    expect(global?.GLOBAL_AGENT?.HTTP_PROXY).toBe('http://localhost:8080')
    const undiciDispatcher = getGlobalDispatcher()
    expect(undiciDispatcher).toBeInstanceOf(ProxyAgent)
  })
})
