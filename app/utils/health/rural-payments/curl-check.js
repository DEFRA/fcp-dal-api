import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { config } from '../../../config.js'
import { RURALPAYMENTS_API_ERROR_001 } from '../../../logger/codes.js'
import { logger } from '../../../logger/logger.js'

// 0o600 (-rw-------): owner can read and write, group and others have no access
const OWNER_READ_WRITE = 0o600

// Promise version of execFile: resolves with { stdout, stderr }, rejects with the error carrying stdout/stderr
const execFileAsync = promisify(execFile)

/**
 * Run curl as a child process and capture its output.
 *
 * @param {string[]} args - Arguments passed directly to the curl binary (no shell interpolation).
 * @param {number} timeout - Maximum run time in milliseconds before the process is terminated.
 * @returns {Promise<{ stdout: string, stderr: string }>} Resolves with curl's stdout and stderr.
 * @throws {Error} Rejects with the execFile error (non-zero exit, timeout or spawn failure),
 *   augmented with the `stdout` and `stderr` captured up to that point.
 */
const execCurl = (args, timeout) => execFileAsync('curl', args, { timeout })

/**
 * Replace the DAL service account email with a placeholder, keeping it out of the logs in line with the
 * datasource (which never logs upstream auth headers).  curl's verbose trace echoes the request headers, and
 * a failed execFile carries the full command line in the error's message, stack and cmd.
 *
 * @param {string | undefined} text - Text that may contain the service account email.
 * @returns {string | undefined} The text with every occurrence of the email redacted.
 */
const redactServiceAccount = (text) => {
  const email = config.get('kits.dalServiceAccountEmail')
  return email && text ? text.replaceAll(email, '*****') : text
}

const formatCurlOutput = (stdout, stderr) =>
  `stdout: ${stdout ?? ''}\nstderr:\n${redactServiceAccount(stderr) ?? ''}`

/**
 * Write the mTLS client cert, key and (if configured) CA for the given gateway into `dir`, since curl
 * can only read them from files.  The caller owns `dir` and is responsible for removing it.
 *
 * @param {'internal' | 'external'} type - Which Rural Payments gateway's mTLS credentials to use.
 * @param {string} dir - Existing directory to write the files into.
 * @returns {Promise<string[]>} The curl arguments that point at the written files.
 */
const writeMtlsFiles = async (type, dir) => {
  const mtls = type === 'external' ? config.externalMTLS : config.internalMTLS

  const certPath = path.join(dir, 'cert.crt')
  const keyPath = path.join(dir, 'key.key')

  await fs.writeFile(certPath, mtls.cert, { mode: OWNER_READ_WRITE })
  await fs.writeFile(keyPath, mtls.key, { mode: OWNER_READ_WRITE })

  const args = ['--key', keyPath, '--cert', certPath]

  if (mtls.ca) {
    const caPath = path.join(dir, 'ca.crt')
    await fs.writeFile(caPath, mtls.ca, { mode: OWNER_READ_WRITE })
    args.push('--cacert', caPath)
  }

  return args
}

/**
 * Diagnostic only: calls the gateway with curl, outside the node process, to give a second view of
 * upstream connectivity (independent of undici).  Failures are logged but never fail the health check.
 * The internal route identifies as the DAL service account via the email header, matching the datasource
 * check.  The external route sends no credentials, so a 403 is expected when auth is enabled.  The response
 * body is discarded; stdout only contains the HTTP status and stderr contains the verbose trace.
 *
 * @param {'internal' | 'external'} type - Which Rural Payments gateway to call.
 * @returns {Promise<void>} Always resolves; errors are logged rather than thrown.
 */
export const runCurlGatewayCheck = async (type) => {
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

    if (type === 'internal') {
      args.push('-H', `email: ${config.get('kits.dalServiceAccountEmail')}`)
    }

    if (!config.get('kits.disableMTLS')) {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `kits-${type}-healthcheck-`))
      const mtlsArgs = await writeMtlsFiles(type, tmpDir)
      args.push(...mtlsArgs)
    }

    args.push(config.get(`kits.${type}.gatewayUrl`))

    const { stdout, stderr } = await execCurl(args, config.get('kits.gatewayTimeoutMs'))
    logger.info(
      `SUCCESS: curl connection to ${type} Rural Payments gateway completed\n${formatCurlOutput(stdout, stderr)}`
    )
  } catch (err) {
    for (const field of ['message', 'stack', 'cmd']) {
      err[field] = redactServiceAccount(err[field])
    }
    logger.error(
      `#DAL - curl connection to ${type} Rural Payments gateway failed\n${formatCurlOutput(err.stdout, err.stderr)}`,
      { error: err, code: RURALPAYMENTS_API_ERROR_001 }
    )
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  }
}
