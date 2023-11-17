const { faker } = require('@faker-js/faker/locale/en_GB')

module.exports = [
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
          body: `<html><input name="csrfToken" value"${faker.string.uuid()}"></html>`
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
        type: 'status',
        options: {
          status: 301,
          headers: {
            location: 'authenticate'
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
            cookie: `AUTH_SESSION=${faker.string.uuid()};CapdAccessToken=${faker.string.uuid()};`
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
        type: 'json',
        options: {
          status: 200,
          body: {
            _data: {
              callerId: faker.string.numeric(7),
              type: 'internal',
              userFirstName: faker.person.firstName(),
              userLastName: faker.person.lastName()
            }
          }
        }
      }
    ]
  }
]
