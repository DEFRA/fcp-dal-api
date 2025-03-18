import server from './server.js'

const url = await server.start()
console.log(`Mock server running ${url}`)
