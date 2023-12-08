import { GraphQLError } from 'graphql'

export class Unauthorized extends GraphQLError {
  constructor (opts) {
    super(opts)
    this.extensions = { code: 'UNAUTHORIZED', http: { status: 401 } }
  }
}
