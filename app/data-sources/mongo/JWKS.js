import { MongoDataSource } from 'apollo-datasource-mongodb'
import { HttpsProxyAgent } from 'https-proxy-agent'
import jwksClient from 'jwks-rsa'
import { config } from '../../config.js'

export class MongoJWKS extends MongoDataSource {
  async retrievePublicKeyByKid(kid) {
    const jwk = await this.findOneById(kid)
    return jwk?.publicKey
  }

  async insertPublicKey(kid, publicKey) {
    return this.collection.insertOne({
      _id: kid,
      publicKey,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  async fetchPublicKey(kid) {
    const clientConfig = {
      jwksUri: config.get('oidc.jwksURI'),
      timeout: config.get('oidc.timeoutMs')
    }

    if (!config.get('disableProxy')) {
      clientConfig.requestAgent = new HttpsProxyAgent(config.get('cdp.httpsProxy'))
    }

    const client = jwksClient({
      ...clientConfig
    })

    const key = await client.getSigningKey(kid)
    const publicKey = key.getPublicKey()
    await this.insertPublicKey(kid, publicKey)
    return publicKey
  }

  async getPublicKey(kid) {
    return (await this.retrievePublicKeyByKid(kid)) ?? this.fetchPublicKey(kid)
  }
}
