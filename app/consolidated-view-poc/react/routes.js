import { graphql } from 'graphql'
import { MongoClient } from 'mongodb'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

import { config } from '../../config.js'
import { MongoBusiness } from '../../data-sources/mongo/Business.js'
import { MongoCustomer } from '../../data-sources/mongo/Customer.js'
import { RuralPaymentsBusiness } from '../../data-sources/rural-payments/RuralPaymentsBusiness.js'
import { RuralPaymentsCustomer } from '../../data-sources/rural-payments/RuralPaymentsCustomer.js'
import { Permissions } from '../../data-sources/static/permissions.js'
import { context } from '../../graphql/context.js'
import { apolloServer, schema } from '../../graphql/server.js'
import { logger } from '../../logger/logger.js'
import { getEmailFromHeaders, getEmailFromQueryParams } from '../parseToken.js'
import { App } from './app/App.js'
import { GET_BUSINESS_CUSTOMERS, GET_CUSTOMER } from './app/queries.js'

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
          const client = new MongoClient(config.get('mongo.mongoUrl'), {
            retryWrites: config.get('mongo.mongoOptions.retryWrites'),
            readPreference: config.get('mongo.mongoOptions.readPreference')
          })
          client.connect()
          const db = client.db(config.get('mongo.databaseName'))

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
              ruralPaymentsCustomer: new RuralPaymentsCustomer(...datasourceOptions),
              mongoCustomer: new MongoCustomer({
                modelOrCollection: db.collection('customers')
              }),
              mongoBusiness: new MongoBusiness({
                modelOrCollection: db.collection('businesses')
              })
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
    // Partial SSR — UI is rendered serer-side without data, all data is fetched client-side
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
    // Full SSR — UI is rendered serer-side with data, subsequent data is fetched client-side
    method: 'GET',
    path: '/consolidated-view-react-full-ssr/linked-contacts/{sbi}',
    handler: async (request, h) => {
      const email = await getEmailFromQueryParams(request.query)

      try {
        // Get list of customer businesses
        const businessCustomers = await graphql({
          source: GET_BUSINESS_CUSTOMERS,
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
          source: GET_CUSTOMER,
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
