import { StatusCodes } from 'http-status-codes'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { config } from '../../config.js'
import { RURALPAYMENTS_API_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { RuralPaymentsReferenceData } from '../../data-sources/rural-payments/RuralPaymentsReferenceData.js'

const runRuralPaymentsCheck = async (type) => {
  try {
    // Rural payment requests must be initiated by a real user (external/internal) or a service-account (internal only).
    // Externally routed requests in this healthcheck will never have the credentials to successfully invoke an endpoint
    // (when auth is turned on).  The goal of the health check is to verify that the upstream is available
    // and serving responses.   A forbidden response is still a response, so the goal of the health check is either an
    // HTTP 200 or HTTP 403 (both will pass, but will be logged differently for visibility).  For the external route,
    // dummy auth credentials must be supplied (as this header is needed to drive the request to the external gateway),
    // the additional healthcheck header instructs the datasource to omit the auth credentials, guaranteeing that the
    // request will fail with a 403
    const headers =
      type === 'external'
        ? { healthcheck: true, 'x-forwarded-authorization': 'healthcheck' }
        : { 'service-account': config.get('kits.dalServiceAccountEmail') }

    const ruralPaymentsReferenceData = new RuralPaymentsReferenceData(
      { logger },
      {
        request: { headers }
      }
    )
    await ruralPaymentsReferenceData.getReferenceData('legalstatus')

    // Success case when auth is not enabled
    logger.info(`SUCCESS: HTTP connection to ${type} Rural Payments upstream succeeded`)
  } catch (err) {
    if (err?.extensions?.http?.status === StatusCodes.FORBIDDEN) {
      // A 403 still means the upstream responded - it just doesn't recognise the caller.
      logger.info(
        `SUCCESS: HTTP connection to ${type} Rural Payments upstream succeeded (received expected 403 Forbidden)`
      )
      return
    }

    // Any other error is unexpected, so fail the health check
    logger.error(`#DAL - Error connecting to ${type} Rural Payments upstream`, {
      error: err,
      code: RURALPAYMENTS_API_ERROR_001
    })
    throw err
  }
}

const execCurl = (args, timeout) =>
  new Promise((resolve, reject) => {
    execFile('curl', args, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout, stderr }))
      } else {
        resolve({ stdout, stderr })
      }
    })
  })

const runCurlGatewayCheck = async (type) => {
  // Diagnostic only: calls the gateway with curl, outside the node process, to give a second view of
  // upstream connectivity (independent of undici).  Failures are logged but never fail the health check.
  // No auth credentials are sent, so a 403 is expected when auth is enabled.  The response body is
  // discarded; stdout only contains the HTTP status and stderr contains the verbose trace.
  let tmpDir
  try {
    const args = [
      '-vL',
      '--trace-time',
      '--silent',
      '--show-error',
      '-o',
      '/dev/null',
      '-w',
      'HTTP %{http_code}'
    ]

    if (!config.get('kits.disableMTLS')) {
      const mtls = type === 'external' ? config.externalMTLS : config.internalMTLS
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `kits-${type}-healthcheck-`))
      const certPath = path.join(tmpDir, 'cert.crt')
      const keyPath = path.join(tmpDir, 'key.key')
      await fs.writeFile(certPath, mtls.cert, { mode: 0o600 })
      await fs.writeFile(keyPath, mtls.key, { mode: 0o600 })
      args.push('--key', keyPath, '--cert', certPath)

      if (mtls.ca) {
        const caPath = path.join(tmpDir, 'ca.crt')
        await fs.writeFile(caPath, mtls.ca, { mode: 0o600 })
        args.push('--cacert', caPath)
      }
    }

    args.push(config.get(`kits.${type}.gatewayUrl`))

    const { stdout, stderr } = await execCurl(args, config.get('kits.gatewayTimeoutMs'))
    logger.info(`SUCCESS: curl connection to ${type} Rural Payments gateway completed`, {
      stdout,
      stderr
    })
  } catch (err) {
    logger.error(`#DAL - curl connection to ${type} Rural Payments gateway failed`, {
      error: err,
      stdout: err.stdout,
      stderr: err.stderr,
      code: RURALPAYMENTS_API_ERROR_001
    })
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  }
}

/** Check that both internal and external Rural Payments endpoints are available */
export const healthCheck = async () => {
  await Promise.all([
    runRuralPaymentsCheck('internal'),
    runRuralPaymentsCheck('external'),
    runCurlGatewayCheck('internal'),
    runCurlGatewayCheck('external')
  ])
}
