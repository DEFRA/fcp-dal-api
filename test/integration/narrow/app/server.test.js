import { server } from '../../../../app/server.js'
import { notEqual } from 'assert'

describe('Server test', () => {
  it('createServer returns server', () => {
    notEqual(server, undefined)
  })
})
