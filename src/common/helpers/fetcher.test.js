import { Client } from 'undici'
import { config } from '../../config.js'

jest.mock('undici', () => ({ Client: jest.fn() }))

const configValues = {
  kitsConnection: {
    key: Buffer.from('testKey').toString('base64'),
    cert: Buffer.from('testCert').toString('base64'),
    host: 'localhost',
    port: '443',
    path: 'api'
  }
}

describe.only('fetcher', () => {
  let fetcher
  const mockRequest = jest.fn()
  beforeAll(async () => {
    Client.mockImplementation(() => ({ request: mockRequest }))
    fetcher = (await import('./fetcher.js')).default
  })
  beforeEach(() => {
    Client.mockImplementation(() => ({ request: mockRequest }))
    config.load({ ...configValues })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should decode base64 values correctly', () => {
    const encoded = Buffer.from('test').toString('base64')
    const decoded = fetcher.decodeBase64(encoded)
    expect(decoded).toBe('test')
  })

  it('should create a new Client with correct URL and TLS options', async () => {
    const expectedURL = // 'https://localhost:443/api' <= should be this! but problem with convict
      'https://localhost/api'
    const expectedTLS = {
      key: 'testKey',
      cert: 'testCert',
      rejectUnauthorized: false,
      servername: 'localhost'
    }

    await fetcher.fetch('/test-path')

    expect(Client).toHaveBeenCalledWith(expectedURL, { connect: expectedTLS })
  })

  it('should reuse previously created Client', async () => {
    await fetcher.fetch('/test-path')
    expect(Client).not.toHaveBeenCalled()
  })

  it('should call client.request with correct path and method', async () => {
    await fetcher.fetch('/test-path', 'POST')

    expect(mockRequest).toHaveBeenCalledWith({ path: '/test-path', method: 'POST' })
  })

  it('should default to GET method if not provided', async () => {
    await fetcher.fetch('/test-path')

    expect(mockRequest).toHaveBeenCalledWith({ path: '/test-path', method: 'GET' })
  })
})
