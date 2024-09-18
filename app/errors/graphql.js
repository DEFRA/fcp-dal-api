import { GraphQLError } from 'graphql'
import { StatusCodes } from 'http-status-codes'

export class Unauthorized extends GraphQLError {
  constructor (opts) {
    super(opts)
    this.extensions = { code: 'UNAUTHORIZED', http: { status: 401 } }
  }
}

export class NotFound extends GraphQLError {
  constructor (opts) {
    super(opts)
    this.extensions = { code: StatusCodes.NOT_FOUND, http: { status: StatusCodes.NOT_FOUND } }
    this.code = StatusCodes.NOT_FOUND
  }
}
