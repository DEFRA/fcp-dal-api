import { faker } from '@faker-js/faker'
import { okResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'apim-authentication-get-token',
    url: '/apim/:tenantId/oauth2/v2.0/token',
    method: ['POST'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const headers = req.headers
            if (!headers['ocp-apim-subscription-key'] || headers['ocp-apim-subscription-key'] !== process.env.VERSION_ONE_APIM_SUBSCRIPTION_KEY) {
              res.status(401)
              return res.send()
            }

            return okResponse(res, {
              access_token: faker.string.uuid(),
              token_type: 'Bearer',
              expires_in: faker.number.int({ min: 1, max: 1000 })
            })
          }
        }
      }
    ]
  }
]
