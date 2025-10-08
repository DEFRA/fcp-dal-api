import { graphql } from 'graphql'
import MiniSearch from 'minisearch'
import { context } from '../../graphql/context.js'
import { schema } from '../../graphql/server.js'
import {
  GET_AUTHENTICATE_QUESTIONS,
  GET_BUSINESS_CUSTOMERS,
  GET_CUSTOMER
} from '../react/app/queries.js'
import { validateAzureADToken } from '../validateToken.js'

export const consolidatedViewRoutes = (staticPath) => [
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
      const token = request.query.token
      if (!token) {
        return h.response().code(403)
      }

      try {
        const user = await validateAzureADToken(token)
        console.log(JSON.stringify(user))
      } catch (error) {
        console.log(JSON.stringify(error))
      }
      const email = 'chris.salt-mountain@defra.gov.uk'

      // Get list of customer businesses
      const listResult = await graphql({
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
      const selectedResult = await graphql({
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
          crn: request.query.selectedCrn || listResult.data.business.customers[0].crn
        }
      })

      let businessCustomers = listResult.data.business.customers
      if (request.query.search) {
        const miniSearch = new MiniSearch({
          idField: 'crn',
          fields: ['firstName', 'lastName', 'crn'],
          storeFields: ['firstName', 'lastName', 'crn']
        })

        miniSearch.addAll(businessCustomers)
        const results = miniSearch.search(request.query.search, { prefix: true })

        if (results.length) {
          businessCustomers = results
        }
      }

      // Authenticate questions view
      let authenticationQuestions = null
      if (request.query.showAuthentication) {
        authenticationQuestions = await graphql({
          source: GET_AUTHENTICATE_QUESTIONS,
          schema,
          contextValue: await context({
            request: {
              headers: {
                email
              }
            }
          }),
          variableValues: { sbi: request.params.sbi, crn: request.query.selectedCrn }
        })
      }

      return h.view('linked-contacts', {
        businessCustomers,
        email,
        search: request.query.search || '',
        selectedCrn: request.query.selectedCrn || listResult.data.business.customers[0].crn,
        selectedResult,
        showAuthentication: request.query.showAuthentication,
        title: 'Linked Contacts',
        authenticationQuestions,
        selectedPermissionIndex: request.query.selectedPermissionIndex
      })
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view/static/{param*}',
    handler: {
      directory: {
        path: staticPath,
        listing: false
      }
    }
  }
]
