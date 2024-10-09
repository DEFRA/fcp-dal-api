import { GraphQLError } from 'graphql'
import StatusCodes from 'http-status-codes'

export class Unauthorized extends GraphQLError {
  constructor (message, options) {
    super(message, options)

    this.extensions.code = StatusCodes.getStatusText(StatusCodes.UNAUTHORIZED).toUpperCase()
    this.extensions.http = { status: StatusCodes.UNAUTHORIZED }
  }
}

export class NotFound extends GraphQLError {
  constructor (message, options) {
    super(message, options)

    this.extensions.code = StatusCodes.getStatusText(StatusCodes.NOT_FOUND).toUpperCase()
    this.extensions.http = { status: StatusCodes.NOT_FOUND }
  }
}

export class Forbidden extends GraphQLError {
  constructor (message, options) {
    super(message, options)

    this.extensions.code = StatusCodes.getStatusText(StatusCodes.FORBIDDEN).toUpperCase()
    this.extensions.http = { status: StatusCodes.FORBIDDEN }
  }
}

export class HttpError extends GraphQLError {
  constructor (statusCode, options) {
    const statusText = StatusCodes.getStatusText(statusCode)

    super(statusText, options)

    this.extensions.code = statusText.toUpperCase()
    this.extensions.http = { status: statusCode }
  }
}
