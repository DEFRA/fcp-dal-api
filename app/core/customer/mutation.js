import { mockCustomer } from './mock.js'

export function updateCustomerAuthenticateHandler(customerAuthenticateUpdate) {
    const updatedAuthenticationQuestions = { ...mockCustomer.customerAuthenticationQuestions, ...customerAuthenticateUpdate }
    mockCustomer.customerAuthenticationQuestions = updatedAuthenticationQuestions
    return updatedAuthenticationQuestions
}
