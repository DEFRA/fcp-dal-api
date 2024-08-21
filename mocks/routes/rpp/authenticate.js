import { okResponse } from '../../utils/requestResponse.js'
import { randomUUID } from 'node:crypto'

export default [
  {
    id: 'rpp-authenticate-get-login',
    url: '/rpp/login',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'text',
        options: {
          status: 200,
          body: `<html><input name="csrfToken" value="${randomUUID()}"/></html>`,
          headers: {
            'set-cookie': `XSRF-TOKEN=${randomUUID()}`
          }
        }
      }
    ]
  },
  {
    id: 'rpp-authenticate-post-login',
    url: '/rpp/login',
    method: ['POST'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const headers = req.headers
            if (!headers.cookie || !headers.cookie.includes('CLEARED-PREVIOUS-SESSION')) {
              res.status(201)
              return res.send('Session exists')
            }
            res.status(301)
            res.setHeader('set-cookie', `XSRF-TOKEN=${randomUUID()}`)
            res.setHeader('location', '/authenticate')
            res.end()
          }
        }
      }
    ]
  },
  {
    id: 'rpp-authenticate-get-authenticate',
    url: '/rpp/authenticate',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'status',
        options: {
          status: 200,
          headers: {
            'set-cookie': `AUTH_SESSION=${randomUUID()};CapdAccessToken=${randomUUID()};XSRF-TOKEN=${randomUUID()}`
          }
        }
      }
    ]
  },
  {
    id: 'rpp-authenticate-get-person-context',
    url: '/rpp/api/person/context',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const headers = req.headers
            if (!headers.cookie || !headers.cookie.includes('AUTH_SESSION')) {
              res.status(401)
              return res.send()
            }

            return okResponse(res, {
              _data: {
                callerId: 1234567,
                type: 'internal',
                userFirstName: 'mockerUserFirstName',
                userLastName: 'mockUserLastName'
              }
            })
          }
        }
      }
    ]
  },
  {
    id: 'rpp-authenticate-get-expire-user-session',
    url: '/rpp/expire_user_session/:email',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'status',
        options: {
          status: 200,
          headers: {
            'set-cookie': 'CLEARED-PREVIOUS-SESSION=true'
          }
        }
      }
    ]
  }
]
