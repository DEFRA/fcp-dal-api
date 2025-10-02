import { graphql } from 'graphql'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { context } from '../../graphql/context.js'
import { schema } from '../../graphql/server.js'
import { App } from './app/App.js'

export const consolidatedViewReactRoutes = (reactAppPath) => [
  {
    method: 'GET',
    path: '/consolidated-view-react/app/{param*}',
    handler: {
      directory: {
        path: reactAppPath,
        listing: false
      }
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view-react/linked-contacts/{sbi}',
    handler: async (request, h) => {
      try {
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

        const props = {
          selectedResult,
          listResult
        }

        return h
          .response(`<!DOCTYPE html>${renderToString(createElement(App, props))}`)
          .type('text/html')
      } catch (error) {
        console.error('Server rendering error:', error)
        return h.response('Error rendering page').code(500)
      }
    }
  }
]
