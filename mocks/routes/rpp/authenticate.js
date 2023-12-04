import { faker } from '@faker-js/faker/locale/en_GB'

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
          body: `<html><input name="csrfToken" value="${faker.string.uuid()}"/></html>`,
          headers: {
            'set-cookie': `XSRF-TOKEN=${faker.string.uuid()}`
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
            res.setHeader('set-cookie', `XSRF-TOKEN=${faker.string.uuid()}`)
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
            'set-cookie': `AUTH_SESSION=${faker.string.uuid()};CapdAccessToken=${faker.string.uuid()};XSRF-TOKEN=${faker.string.uuid()}`
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

            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                _data: {
                  callerId: faker.string.numeric(7),
                  type: 'internal',
                  userFirstName: faker.person.firstName(),
                  userLastName: faker.person.lastName()
                }
              })
            )
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
