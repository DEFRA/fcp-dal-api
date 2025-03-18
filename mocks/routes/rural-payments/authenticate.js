import { authenticateAnswers } from '../../fixtures/authenticate.js'
import { noContentResponse, okOrNoContentResponse } from '../../utils/requestResponse.js'

export default [
  {
    id: 'rural-payments-authenticate-get-by-crn',
    url: '/v1/external-auth/security-answers/:crn',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const crn = req.params.crn
            const data = authenticateAnswers(crn)
            return okOrNoContentResponse(res, data)
          }
        }
      },
      {
        id: 'not-found',
        type: 'middleware',
        options: {
          middleware: (_, res) => {
            return noContentResponse(res)
          }
        }
      }
    ]
  }
]
