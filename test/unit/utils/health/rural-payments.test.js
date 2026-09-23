import { expect, jest } from '@jest/globals'
import os from 'node:os'
import path from 'node:path'
import { config } from '../../../../app/config.js'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const RuralPaymentsReferenceDataMock = jest.fn()
const getReferenceDataMock = jest.fn()
const execFileMock = jest.fn()
const fsMock = {
  mkdtemp: jest.fn(),
  writeFile: jest.fn(),
  rm: jest.fn()
}

jest.unstable_mockModule('../../../../app/logger/logger.js', () => mockLogger)

jest.unstable_mockModule(
  '../../../../app/data-sources/rural-payments/RuralPaymentsReferenceData.js',
  () => ({ RuralPaymentsReferenceData: RuralPaymentsReferenceDataMock })
)

jest.unstable_mockModule('node:child_process', () => ({ execFile: execFileMock }))
jest.unstable_mockModule('node:fs/promises', () => ({ default: fsMock }))

const { healthCheck } = await import('../../../../app/utils/health/rural-payments.js')

describe('Rural payments health check', () => {
  beforeEach(() => {
    RuralPaymentsReferenceDataMock.mockImplementation(() => ({
      getReferenceData: getReferenceDataMock
    }))
    getReferenceDataMock.mockResolvedValue()
    fsMock.mkdtemp.mockImplementation(async (prefix) => `${prefix}XXXXXX`)
    execFileMock.mockImplementation((file, args, options, callback) =>
      callback(null, 'HTTP 403', 'curl verbose trace')
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log success when rural payments connects for both internal and external gateways', async () => {
    await healthCheck()

    expect(getReferenceDataMock).toHaveBeenCalledTimes(2)
    expect(RuralPaymentsReferenceDataMock).toHaveBeenCalledWith(
      { logger: mockLogger.logger },
      {
        request: {
          headers: {
            'service-account': config.get('kits.dalServiceAccountEmail')
          }
        }
      }
    )
    expect(RuralPaymentsReferenceDataMock).toHaveBeenCalledWith(
      { logger: mockLogger.logger },
      {
        request: { headers: { healthcheck: true, 'x-forwarded-authorization': 'healthcheck' } }
      }
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to internal Rural Payments upstream succeeded'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to external Rural Payments upstream succeeded'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledTimes(4)
  })

  it('should log success, and not throw, when upstream responds with a 403 Forbidden', async () => {
    const forbiddenError = Object.assign(new Error('Forbidden'), {
      extensions: { http: { status: 403 } }
    })
    getReferenceDataMock.mockRejectedValue(forbiddenError)

    await expect(healthCheck()).resolves.toBeUndefined()

    expect(mockLogger.logger.error).not.toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to internal Rural Payments upstream succeeded (received expected 403 Forbidden)'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to external Rural Payments upstream succeeded (received expected 403 Forbidden)'
    )
  })

  it('should log error and throw when the internal gateway fails to connect', async () => {
    const mockError = new Error('Rural payments connection failed')
    getReferenceDataMock.mockRejectedValueOnce(mockError)

    await expect(healthCheck()).rejects.toThrow('Rural payments connection failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to internal Rural Payments upstream',
      {
        error: mockError,
        code: expect.any(String)
      }
    )
  })

  it('should log error and throw when only the external gateway fails to connect', async () => {
    const mockError = new Error('Rural payments connection failed')
    getReferenceDataMock.mockResolvedValueOnce().mockRejectedValueOnce(mockError)

    await expect(healthCheck()).rejects.toThrow('Rural payments connection failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to external Rural Payments upstream',
      {
        error: mockError,
        code: expect.any(String)
      }
    )
  })

  describe('curl gateway check', () => {
    const originalInternalMTLS = config.internalMTLS
    const originalExternalMTLS = config.externalMTLS
    let disableMTLS

    beforeEach(() => {
      disableMTLS = false
      const originalGet = config.get.bind(config)
      jest
        .spyOn(config, 'get')
        .mockImplementation((key) => (key === 'kits.disableMTLS' ? disableMTLS : originalGet(key)))
      config.internalMTLS = { cert: 'internal-cert', key: 'internal-key' }
      config.externalMTLS = { cert: 'external-cert', key: 'external-key' }
    })

    afterEach(() => {
      jest.restoreAllMocks()
      config.internalMTLS = originalInternalMTLS
      config.externalMTLS = originalExternalMTLS
    })

    const curlArgsFor = (type) =>
      execFileMock.mock.calls.find(([, args]) =>
        args.includes(config.get(`kits.${type}.gatewayUrl`))
      )[1]

    it.each(['internal', 'external'])(
      'should call the %s gateway with curl using mTLS and log stdout and stderr',
      async (type) => {
        await healthCheck()

        expect(execFileMock).toHaveBeenCalledTimes(2)
        const tmpDir = path.join(os.tmpdir(), `kits-${type}-healthcheck-XXXXXX`)
        expect(fsMock.writeFile).toHaveBeenCalledWith(
          path.join(tmpDir, 'cert.crt'),
          `${type}-cert`,
          { mode: 0o600 }
        )
        expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(tmpDir, 'key.key'), `${type}-key`, {
          mode: 0o600
        })
        expect(curlArgsFor(type)).toEqual([
          '-vL',
          '--trace-time',
          '--silent',
          '--show-error',
          '-o',
          '/dev/null',
          '-w',
          'HTTP %{http_code}',
          '--key',
          path.join(tmpDir, 'key.key'),
          '--cert',
          path.join(tmpDir, 'cert.crt'),
          config.get(`kits.${type}.gatewayUrl`)
        ])
        expect(mockLogger.logger.info).toHaveBeenCalledWith(
          `SUCCESS: curl connection to ${type} Rural Payments gateway completed\nstdout: HTTP 403\nstderr:\ncurl verbose trace`
        )
        expect(fsMock.rm).toHaveBeenCalledWith(tmpDir, { recursive: true, force: true })
      }
    )

    it('should not send any authorization header', async () => {
      await healthCheck()

      for (const [, args] of execFileMock.mock.calls) {
        expect(args).not.toContain('-H')
        expect(args.join(' ')).not.toMatch(/authorization/i)
      }
    })

    it('should pass the CA cert to curl when one is configured', async () => {
      config.externalMTLS = { cert: 'external-cert', key: 'external-key', ca: 'ca-cert' }

      await healthCheck()

      const caPath = path.join(os.tmpdir(), 'kits-external-healthcheck-XXXXXX', 'ca.crt')
      expect(fsMock.writeFile).toHaveBeenCalledWith(caPath, 'ca-cert', { mode: 0o600 })
      expect(curlArgsFor('external')).toEqual(expect.arrayContaining(['--cacert', caPath]))
      expect(curlArgsFor('internal')).not.toContain('--cacert')
    })

    it('should not write or pass certs when mTLS is disabled', async () => {
      disableMTLS = true

      await healthCheck()

      expect(fsMock.mkdtemp).not.toHaveBeenCalled()
      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(fsMock.rm).not.toHaveBeenCalled()
      expect(curlArgsFor('internal')).not.toContain('--cert')
      expect(curlArgsFor('external')).not.toContain('--cert')
    })

    it('should log an error, including stdout and stderr, but not throw when curl fails', async () => {
      const curlError = new Error('curl failed')
      execFileMock.mockImplementation((file, args, options, callback) =>
        callback(curlError, 'HTTP 000', 'curl: (35) SSL connect error')
      )

      await expect(healthCheck()).resolves.toBeUndefined()

      for (const type of ['internal', 'external']) {
        expect(mockLogger.logger.error).toHaveBeenCalledWith(
          `#DAL - curl connection to ${type} Rural Payments gateway failed\nstdout: HTTP 000\nstderr:\ncurl: (35) SSL connect error`,
          { error: curlError, code: expect.any(String) }
        )
      }
      expect(fsMock.rm).toHaveBeenCalledTimes(2)
    })
  })
})
