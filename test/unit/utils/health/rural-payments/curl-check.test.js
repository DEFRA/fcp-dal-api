import { expect, jest } from '@jest/globals'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { config } from '../../../../../app/config.js'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const execFileAsyncMock = jest.fn()
const fsMock = {
  mkdtemp: jest.fn(),
  writeFile: jest.fn(),
  rm: jest.fn()
}

jest.unstable_mockModule('../../../../../app/logger/logger.js', () => mockLogger)

jest.unstable_mockModule('node:child_process', () => ({
  execFile: Object.assign(jest.fn(), { [promisify.custom]: execFileAsyncMock })
}))
jest.unstable_mockModule('node:fs/promises', () => ({ default: fsMock }))

const { runCurlGatewayCheck } =
  await import('../../../../../app/utils/health/rural-payments/curl-check.js')

describe('Rural payments curl gateway check', () => {
  const originalInternalMTLS = config.internalMTLS
  const originalExternalMTLS = config.externalMTLS
  let disableMTLS
  let serviceAccountEmail

  beforeEach(() => {
    disableMTLS = false
    serviceAccountEmail = 'dal-service-account@defra.gov.uk'
    const originalGet = config.get.bind(config)
    jest.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'kits.disableMTLS') return disableMTLS
      if (key === 'kits.dalServiceAccountEmail') return serviceAccountEmail
      return originalGet(key)
    })
    config.internalMTLS = { cert: 'internal-cert', key: 'internal-key' }
    config.externalMTLS = { cert: 'external-cert', key: 'external-key' }
    fsMock.mkdtemp.mockImplementation(async (prefix) => `${prefix}XXXXXX`)
    execFileAsyncMock.mockResolvedValue({ stdout: 'HTTP 403', stderr: 'curl verbose trace' })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    config.internalMTLS = originalInternalMTLS
    config.externalMTLS = originalExternalMTLS
  })

  const curlArgs = () => execFileAsyncMock.mock.calls[0][1]

  it.each(['internal', 'external'])(
    'should call the %s gateway with curl using mTLS and log stdout and stderr',
    async (type) => {
      await runCurlGatewayCheck(type)

      expect(execFileAsyncMock).toHaveBeenCalledTimes(1)
      expect(execFileAsyncMock).toHaveBeenCalledWith('curl', expect.any(Array), {
        timeout: config.get('kits.gatewayTimeoutMs')
      })
      const tmpDir = path.join(os.tmpdir(), `kits-${type}-healthcheck-XXXXXX`)
      expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(tmpDir, 'cert.crt'), `${type}-cert`, {
        mode: 0o600
      })
      expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(tmpDir, 'key.key'), `${type}-key`, {
        mode: 0o600
      })
      expect(curlArgs()).toEqual([
        '-vL',
        '--trace-time',
        '--silent',
        '--show-error',
        '-o',
        '/dev/null',
        '-w',
        'HTTP %{http_code}',
        ...(type === 'internal'
          ? ['-H', `email: ${config.get('kits.dalServiceAccountEmail')}`]
          : []),
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

  it('should identify as the DAL service account via the email header on the internal gateway', async () => {
    await runCurlGatewayCheck('internal')

    expect(curlArgs()).toEqual(
      expect.arrayContaining(['-H', `email: ${config.get('kits.dalServiceAccountEmail')}`])
    )
    expect(curlArgs().join(' ')).not.toMatch(/authorization/i)
  })

  it('should not send any headers to the external gateway', async () => {
    await runCurlGatewayCheck('external')

    expect(curlArgs()).not.toContain('-H')
    expect(curlArgs().join(' ')).not.toMatch(/authorization|email/i)
  })

  it('should pass the CA cert to curl when one is configured', async () => {
    config.externalMTLS = { cert: 'external-cert', key: 'external-key', ca: 'ca-cert' }

    await runCurlGatewayCheck('external')

    const caPath = path.join(os.tmpdir(), 'kits-external-healthcheck-XXXXXX', 'ca.crt')
    expect(fsMock.writeFile).toHaveBeenCalledWith(caPath, 'ca-cert', { mode: 0o600 })
    expect(curlArgs()).toEqual(expect.arrayContaining(['--cacert', caPath]))
  })

  it('should not pass a CA cert to curl when none is configured', async () => {
    await runCurlGatewayCheck('internal')

    expect(curlArgs()).not.toContain('--cacert')
  })

  it.each(['internal', 'external'])(
    'should not write or pass certs to the %s gateway when mTLS is disabled',
    async (type) => {
      disableMTLS = true

      await runCurlGatewayCheck(type)

      expect(fsMock.mkdtemp).not.toHaveBeenCalled()
      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(fsMock.rm).not.toHaveBeenCalled()
      expect(curlArgs()).not.toContain('--cert')
    }
  )

  it.each(['internal', 'external'])(
    'should log an error, including stdout and stderr, but not throw when curl to the %s gateway fails',
    async (type) => {
      const curlError = new Error('curl failed')
      execFileAsyncMock.mockRejectedValue(
        Object.assign(curlError, { stdout: 'HTTP 000', stderr: 'curl: (35) SSL connect error' })
      )

      await expect(runCurlGatewayCheck(type)).resolves.toBeUndefined()

      expect(mockLogger.logger.error).toHaveBeenCalledWith(
        `#DAL - curl connection to ${type} Rural Payments gateway failed\nstdout: HTTP 000\nstderr:\ncurl: (35) SSL connect error`,
        { error: curlError, code: expect.any(String) }
      )
      expect(fsMock.rm).toHaveBeenCalledTimes(1)
    }
  )

  it('should log an error with empty stdout and stderr when curl fails without producing output', async () => {
    const spawnError = new Error('spawn curl ENOENT')
    execFileAsyncMock.mockRejectedValue(spawnError)

    await expect(runCurlGatewayCheck('internal')).resolves.toBeUndefined()

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - curl connection to internal Rural Payments gateway failed\nstdout: \nstderr:\n',
      { error: spawnError, code: expect.any(String) }
    )
  })

  describe('service account redaction', () => {
    it('should redact the service account email from the logged trace on success', async () => {
      execFileAsyncMock.mockResolvedValue({
        stdout: 'HTTP 200',
        stderr: `> email: ${serviceAccountEmail}\n* [HTTP/2] [1] [email: ${serviceAccountEmail}]`
      })

      await runCurlGatewayCheck('internal')

      expect(mockLogger.logger.info).toHaveBeenCalledWith(
        'SUCCESS: curl connection to internal Rural Payments gateway completed\nstdout: HTTP 200\nstderr:\n> email: *****\n* [HTTP/2] [1] [email: *****]'
      )
    })

    it('should redact the service account email from the logged trace and error on failure', async () => {
      const command = `curl -vL -H email: ${serviceAccountEmail} https://gateway`
      const curlError = Object.assign(new Error(`Command failed: ${command}`), {
        cmd: command,
        stdout: 'HTTP 000',
        stderr: `> email: ${serviceAccountEmail}`
      })
      execFileAsyncMock.mockRejectedValue(curlError)

      await runCurlGatewayCheck('internal')

      const [message, { error }] = mockLogger.logger.error.mock.calls[0]
      expect(message).toBe(
        '#DAL - curl connection to internal Rural Payments gateway failed\nstdout: HTTP 000\nstderr:\n> email: *****'
      )
      expect(error.message).toBe('Command failed: curl -vL -H email: ***** https://gateway')
      expect(error.cmd).toBe('curl -vL -H email: ***** https://gateway')
      expect(error.stack).not.toContain(serviceAccountEmail)
    })

    it('should leave the trace unchanged when no service account email is configured', async () => {
      serviceAccountEmail = null

      await runCurlGatewayCheck('external')

      expect(mockLogger.logger.info).toHaveBeenCalledWith(
        'SUCCESS: curl connection to external Rural Payments gateway completed\nstdout: HTTP 403\nstderr:\ncurl verbose trace'
      )
    })
  })
})
