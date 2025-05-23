import { GraphQLError } from 'graphql'
import StatusCodes from 'http-status-codes'
import { BadRequest, HttpError, NotFound, Unauthorized } from '../../../app/errors/graphql.js'

describe('Custom GraphQL HTTP Errors', () => {
  test('Unauthorized error sets correct code and http status', () => {
    const err = new Unauthorized('Unauthorized access')

    expect(err).toBeInstanceOf(GraphQLError)
    expect(err.message).toBe('Unauthorized access')
    expect(err.extensions.code).toBe('UNAUTHORIZED')
    expect(err.extensions.http).toEqual({ status: StatusCodes.UNAUTHORIZED })
  })

  test('NotFound error sets correct code and http status', () => {
    const err = new NotFound('Resource not found')

    expect(err).toBeInstanceOf(GraphQLError)
    expect(err.message).toBe('Resource not found')
    expect(err.extensions.code).toBe('NOT FOUND')
    expect(err.extensions.http).toEqual({ status: StatusCodes.NOT_FOUND })
  })

  test('BadRequest error sets correct code and http status', () => {
    const err = new BadRequest('Invalid input')

    expect(err).toBeInstanceOf(GraphQLError)
    expect(err.message).toBe('Invalid input')
    expect(err.extensions.code).toBe('BAD REQUEST')
    expect(err.extensions.http).toEqual({ status: StatusCodes.BAD_REQUEST })
  })

  test('HttpError sets code and http status dynamically', () => {
    const status = StatusCodes.FORBIDDEN
    const err = new HttpError(status)

    expect(err).toBeInstanceOf(GraphQLError)
    expect(err.message).toBe(StatusCodes.getStatusText(status))
    expect(err.extensions.code).toBe(StatusCodes.getStatusText(status).toUpperCase())
    expect(err.extensions.http).toEqual({ status })
  })

  test('All custom errors accept options', () => {
    const options = { path: ['query', 'user'] }
    const err = new Unauthorized('Unauthorized access', options)

    expect(err.path).toEqual(['query', 'user'])
  })
})
