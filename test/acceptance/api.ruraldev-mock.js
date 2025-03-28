import { readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'undici'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serverOptions = {
  ca: [readFileSync(join(__dirname, '../../test_scripts/mtls/ca.crt'), 'utf8')],
  key: readFileSync(join(__dirname, '../../test_scripts/mtls/server.key'), 'utf8'),
  cert: readFileSync(join(__dirname, '../../test_scripts/mtls/server.crt'), 'utf8'),
  requestCert: true,
  rejectUnauthorized: false
}

const server = createServer(serverOptions, (req, res) => {
  console.log('handling request...')
  // true if client cert is valid
  if (req.client.authorized === true) {
    console.log('valid')
  } else {
    console.error('cert error:', req.client.authorizationError)
    res.statusCode = 401
  }
  res.write(JSON.stringify({ status: req.client.authorizationError || 'ok' }), () => res.end())
})

server.listen(0, 'localhost', function () {
  const tls = {
    ca: [readFileSync(join(__dirname, '../../test_scripts/mtls/ca.crt'), 'utf8')],
    key: readFileSync(join(__dirname, '../../test_scripts/mtls/client.key'), 'utf8'),
    cert: readFileSync(join(__dirname, '../../test_scripts/mtls/client.crt'), 'utf8'),
    rejectUnauthorized: false,
    servername: 'localhost'
  }
  const client = new Client(`https://localhost:${server.address().port}`, {
    connect: tls
  })

  client
    .request({
      path: '/',
      method: 'GET'
    })
    .then((res) => {
      console.log(res.statusCode)
      process.exitCode = res.statusCode === 200 ? 0 : 1
      return res.body.json()
    })
    .then((json) => {
      console.log(json)
      client.destroy()
    })
    .then(() => server.close())
})
