import { server } from '../../../../../app/server.js'

describe('Server test', () => {
  it('createServer returns server', () => {
    expect(server).not.toBeUndefined()
  })
})
