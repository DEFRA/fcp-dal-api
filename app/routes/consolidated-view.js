import { graphql } from 'graphql'
import { context } from '../graphql/context.js'
import { schema } from '../graphql/server.js'

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
    path: '/consolidated-view/linked-contacts/{sbi}',
    handler: async (request, h) => {
      // Get list of customer businesses
      const listResult = await graphql({
        source: `#graphql
          query LinkedContactsPage($sbi: ID!) {
            business(sbi: $sbi) {
              sbi
              customers {
                personId
                firstName
                lastName
                crn
                role
              }
            }
          }
        `,
        schema,
        contextValue: await context({
          request: {
            headers: {
              email: 'test@defra.gov.uk',
              'gateway-type': 'internal'
            }
          }
        }),
        variableValues: { sbi: request.params.sbi }
      })

      // Get first customer from the list
      const selectedResult = await graphql({
        source: `#graphql
          query LinkedCustomerPermissions($sbi: ID!, $crn: ID!) {
            business(sbi: $sbi) {
              customer(crn: $crn) {
                role
                permissionGroups {
                  id
                  level
                  functions
                }
              }
            }
            customer(crn: $crn) {
              crn
              info {
                name {
                  title
                  first
                  middle
                  last
                }
                dateOfBirth
              }
            }
          }
        `,
        schema,
        contextValue: await context({
          request: {
            headers: {
              email: 'test@defra.gov.uk',
              'gateway-type': 'internal'
            }
          }
        }),
        variableValues: {
          sbi: request.params.sbi,
          crn: listResult.data.business.customers[0].crn
        }
      })

      return h.view('linked-contacts', {
        title: 'Linked Contacts',
        listResult,
        selectedResult,
        searchValue: request.query.search || ''
      })
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
