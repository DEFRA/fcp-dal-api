import basicAuthParser from 'basic-auth-parser'
import { createProxy } from 'proxy'

const proxyServer = createProxy()
const username = process.env.PROXY_USERNAME || 'username'
const password = process.env.PROXY_PASSWORD || 'password'
proxyServer.authenticate = (req) => {
  const auth = req.headers['proxy-authorization']
  console.debug('Proxy auth header:', auth)
  if (auth) {
    const parsed = basicAuthParser(auth)
    console.debug('Parsed auth:', parsed)

    if (parsed.username === username && parsed.password === password) {
      return true
    }
  }
  return false
}

const port = process.env.PROXY_PORT || 3128
const host = process.env.PROXY_HOST || 'localhost'
proxyServer.listen(port, host, () => {
  const listening = proxyServer.address()
  console.log(`Proxy server running on http://${listening.address}:${listening.port}`)
})

process.on('SIGINT', () => {
  console.log('Shutting down proxy...')
  proxyServer.close(() => console.log('Proxy server closed'))
})
