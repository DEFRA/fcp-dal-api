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
    path: '/consolidated-view-react-partial-ssr/linked-contacts/{sbi}',
    handler: async (request, h) => {
      const email = request.query.email
      if (!email) {
        return h
          .response({
            error: 'Bad Request',
            message: 'Email not provided'
          })
          .code(400)
      }

      try {
        const props = {
          sbi: request.params.sbi,
          email,
          preloaded: {}
        }

        return h
          .response(`<!DOCTYPE html>${renderToString(createElement(App, props))}`)
          .type('text/html')
      } catch (error) {
        console.error('Server rendering error:', error)
        return h.response('Error rendering page').code(500)
      }
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view-react-full-ssr/linked-contacts/{sbi}',
    handler: async (request, h) => {
      const email = request.query.email
      if (!email) {
        return h
          .response({
            error: 'Bad Request',
            message: 'Email not provided'
          })
          .code(400)
      }

      try {
        // Get list of customer businesses
        const businessCustomers = await graphql({
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
                email
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
                    functions
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
                email
              }
            }
          }),
          variableValues: {
            sbi: request.params.sbi,
            crn: businessCustomers.data.business.customers[0].crn
          }
        })

        const props = {
          sbi: request.params.sbi,
          email,
          preloaded: {
            businessCustomers: businessCustomers.data,
            selectedCustomer: selectedCustomer.data
          }
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
