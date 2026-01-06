import { HttpsProxyAgent } from 'https-proxy-agent'
import https from 'node:https'

const promisedHttpsRequest = (url, options = {}) =>
  new Promise((resolve, reject) => {
    const request = https.request(
      url,
      { ...options, agent: new HttpsProxyAgent(process.env.HTTPS_PROXY) },
      (response) => {
        const chunks = []
        response.on('data', (c) => chunks.push(c))
        response.on('error', reject)
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          resolve({ statusCode: response.statusCode, headers: response.headers, body })
        })
      }
    )
    request.on('error', reject)
    if (options.body) request.write(options.body)
    request.end()
  })

const httpsProxyFetch = async (url, options = {}) => {
  const { statusCode, headers, body } = await promisedHttpsRequest(url, options)
  return {
    status: statusCode,
    headers,
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body))
  }
}

export { httpsProxyFetch }
