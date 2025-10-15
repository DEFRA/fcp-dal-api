import { graphql } from 'graphql'
import MiniSearch from 'minisearch'
import { context } from '../../graphql/context.js'
import { schema } from '../../graphql/server.js'
import { getEmailFromQueryParams } from '../parseToken.js'
import {
  GET_AUTHENTICATE_QUESTIONS,
  GET_BUSINESS_CUSTOMERS,
  GET_CUSTOMER
} from '../react/app/queries.js'

export const consolidatedViewRoutes = (staticPath) => [
  {
    method: 'GET',
    path: '/consolidated-view/login',
    handler: (_request, h) => {
      return h.view('login')
    }
  },
  {
    method: 'GET',
    path: '/consolidated-view/linked-contacts/{sbi}',
    handler: async (request, h) => {
      const email = await getEmailFromQueryParams(request.query)

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

      // Server-side search
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
        selectedPermissionIndex: request.query.selectedPermissionIndex,
        token: request.query.token
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
