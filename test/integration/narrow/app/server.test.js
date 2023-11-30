import { server } from '../../../../app/server.js'
import { notEqual } from 'assert'

describe('Server test', () => {
  it('createServer returns server', () => {
    notEqual(server, undefined)
  })
})

// import { server } from '../../../../app/server.js'
// import { notEqual } from 'assert'
// import mockServer from '../../../../mocks/server.js'
// import sinon from 'sinon'

// describe('Server test', () => {
//   let mockServerStub
//   beforeEach(() => {
//     mockServerStub = sinon.stub(mockServer, 'start').returns('some date');
//   })

//   afterEach(() => {
//     mockServerStub.reset()
//   })

//   it('createServer returns server', () => {
//     notEqual(server, undefined)
//   })
// })
