export const healthRoute = {
  method: 'GET',
  path: '/health',
  handler: (_request, h) => {
    return h.response('ok').code(200)
  }
}
