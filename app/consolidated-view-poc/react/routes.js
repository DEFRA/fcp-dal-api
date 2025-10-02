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
        const {
          data: { business }
        } = await graphql({
          source: `#graphql
              query LinkedContactsPage($sbi: ID!) {
                business(sbi: $sbi) {
                  sbi
                  customers {
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
                email: 'test@defra.gov.uk'
              }
            }
          }),
          variableValues: { sbi: request.params.sbi }
        })

        // Get first customer from the list
        const selectedCustomer = await graphql({
          source: `#graphql
            query SelectedCustomer($crn: ID!, $sbi: ID!) {
              customer(crn: $crn) {
                crn
                info {
                  name {
                    title
                    otherTitle
                    first
                    middle
                    last
                  }
                }
                business(sbi: $sbi) {
                  sbi
                  permissionGroups {
                    id
                    level
                  }
                  role
                }
              }
            }
            `,
          schema,
          contextValue: await context({
            request: {
              headers: {
                email: 'test@defra.gov.uk'
              }
            }
          }),
          variableValues: {
            sbi: request.params.sbi,
            crn: business.customers[0].crn
          }
        })

        const props = {
          business,
          initialSelectedCustomer: selectedCustomer.data.customer
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
