import { graphql } from 'graphql'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { RuralPaymentsBusiness } from '../../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../../data-sources/static/permissions.js'
import { context } from '../../graphql/context.js'
import { apolloServer, schema } from '../../graphql/server.js'
import { logger } from '../../logger/logger.js'
import { getEmailFromHeaders } from '../getEmailFromHeaders.js'
import { App } from './app/App.js'

export const consolidatedViewReactRoutes = (reactAppPath) => [
  {
    method: 'POST',
    path: '/consolidated-view/graphql',
    handler: async (request, h) => {
      const email = await getEmailFromHeaders(request.headers)

      const response = await apolloServer.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: 'POST',
          headers: new Map([['content-type', 'application/json']]),
          body: request.payload
        },
        context: async () => {
          const requestLogger = logger.child({
            transactionId: request.transactionId,
            traceId: request.traceId
          })

          const datasourceOptions = [
            { logger: requestLogger },
            {
              request: { headers: { email } },
              gatewayType: 'internal'
            }
          ]

          return {
            dataSources: {
              permissions: new Permissions({ logger: requestLogger }),
              ruralPaymentsBusiness: new RuralPaymentsBusiness(...datasourceOptions),
              ruralPaymentsCustomer: new RuralPaymentsCustomer(...datasourceOptions)
            }
          }
        }
      })

      return h.response(response.body.string).type('application/json')
    }
  },
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
      try {
        const props = {
          sbi: request.params.sbi,
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
      const token = request.query.token
      if (!token) {
        return h.response().code(403)
      }

      const email = 'chris.salt-mountain@defra.gov.uk'

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
