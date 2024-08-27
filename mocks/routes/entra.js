export default [
  {
    id: 'entra-id-get-user',
    url: '/entra-id/v1.0/users/:id',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            employeeId: 'x123456'
          }
        }
      }
    ]
  }
]
