export const consolidatedViewRoutes = (cssPath) => [
  {
    method: 'GET',
    path: '/consolidated-view/loading',
    handler: (_request, h) => {
      const context = {
        title: 'Loading',
        items: ['Item 1', 'Item 2', 'Item 3']
      }
      return h.view('loading', context)
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view/login',
    handler: (_request, h) => {
      const context = {
        title: 'Login',
        items: ['Item 1', 'Item 2', 'Item 3']
      }
      return h.view('login', context)
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view/linked-contacts',
    handler: (_request, h) => {
      const context = {
        title: 'Linked Contacts',
        items: ['Item 1', 'Item 2', 'Item 3']
      }
      return h.view('linked-contacts', context)
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view/css/{param*}',
    handler: {
      directory: {
        path: cssPath,
        listing: true
      }
    }
  }
]
