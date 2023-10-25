import { mockCustomer } from './mock.js'

export function updateCustomerAuthenticateHandler(customerAuthenticateUpdate) {
    // Update logic to be added here
    return { ...mockCustomer.authenticationQuestions, ...customerAuthenticateUpdate }
}