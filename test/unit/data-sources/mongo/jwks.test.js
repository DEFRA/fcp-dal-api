// describe('getJwtPublicKey', () => {
//   const { publicKey, privateKey } = generateKeyPairSync('rsa', {
//     modulusLength: 2048
//   })

//   beforeAll(() => {
//     nock.disableNetConnect()
//   })

//   beforeEach(() => {
//     nock(config.get('oidc.jwksURI'))
//       .get('/')
//       .reply(200, {
//         keys: [
//           {
//             kty: 'RSA',
//             kid: 'mock-key-id-123',
//             alg: 'RS256',
//             use: 'sig',
//             n: publicKey.export({ format: 'jwk' }).n,
//             e: publicKey.export({ format: 'jwk' }).e
//           }
//         ]
//       })
//   })

//   afterAll(() => {
//     nock.cleanAll()
//     nock.enableNetConnect()
//   })

//   it('should return the public key and proxy called', async () => {
//     const { getJwtPublicKey } = await import('../../../app/auth/authenticate.js')
//     const mockTokenPayload = {
//       iat: Math.floor(Date.now() / 1000)
//     }

//     const mockToken = jwt.sign(mockTokenPayload, privateKey, {
//       algorithm: 'RS256'
//     })

//     expect(jwt.verify(mockToken, await getJwtPublicKey('mock-key-id-123'))).toEqual(
//       mockTokenPayload
//     )
//     expect(mockHttpsProxyAgent).toHaveBeenCalledWith(config.get('cdp.httpsProxy'))
//   })

//   it('should return the public key without proxy', async () => {
//     config.set('disableProxy', true)
//     const { getJwtPublicKey } = await import('../../../app/auth/authenticate.js')
//     const mockTokenPayload = {
//       iat: Math.floor(Date.now() / 1000)
//     }

//     const mockToken = jwt.sign(mockTokenPayload, privateKey, {
//       algorithm: 'RS256'
//     })

//     expect(jwt.verify(mockToken, await getJwtPublicKey('mock-key-id-123'))).toEqual(
//       mockTokenPayload
//     )
//     expect(mockHttpsProxyAgent).not.toHaveBeenCalled()
//   })
// })
