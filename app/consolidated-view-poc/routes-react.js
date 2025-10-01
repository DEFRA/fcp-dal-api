export const consolidatedViewReactRoutes = (staticPath) => [
  {
    method: 'GET',
    path: '/consolidated-view-react/linked-contacts/{sbi}',
    handler: (_request, h) => {
      return h.view('linked-contacts-react')
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view-react/static/{param*}',
    handler: {
      directory: {
        path: staticPath,
        listing: false
      }
    }
  }
]
