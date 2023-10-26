import { mockCustomer } from './mock.js'

export function updateCustomerAuthenticateHandler (customerAuthenticateUpdate) {
  const updatedAuthenticationQuestions = { ...mockCustomer.authenticationQuestions, ...customerAuthenticateUpdate }
  mockCustomer.authenticationQuestions = updatedAuthenticationQuestions
  return updatedAuthenticationQuestions
}
