import { gql, GraphQLClient } from 'graphql-request'
import { beforeAll, describe, expect, it } from 'vitest'
const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const headers = { email: 'some-email' }

const createCustomerMutation = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      customer {
        personId
        crn
      }
    }
  }
`

const customerDuplicateQuery = gql`
  query CustomerDuplicate($input: CustomerDuplicateInput!) {
    customerDuplicate(input: $input) {
      crn
      personId
      first
      last
      dateOfBirth
      phone {
        mobile
        landline
      }
    }
  }
`

describe('customerDuplicate Query', () => {
  const client = new GraphQLClient(targetURL)
  // a customer created here, as the static fixtures may be deactivated, which never match
  const details = {
    first: 'Duplicate',
    last: `Check-${Date.now()}`,
    dateOfBirth: '1980-06-10',
    phone: { mobile: '07700 900123', landline: null }
  }
  let existing

  beforeAll(async () => {
    const response = await client.request(createCustomerMutation, { input: details }, headers)
    existing = response.createCustomer.customer
  })

  it('should return the existing customer that matches the details', async () => {
    const response = await client.request(customerDuplicateQuery, { input: details }, headers)

    expect(response.customerDuplicate).toEqual({
      crn: existing.crn,
      personId: existing.personId,
      first: details.first,
      last: details.last,
      dateOfBirth: details.dateOfBirth,
      phone: details.phone
    })
  })

  it('should return null when no customer matches the details', async () => {
    const response = await client.request(
      customerDuplicateQuery,
      { input: { ...details, dateOfBirth: '1981-06-10' } },
      headers
    )

    expect(response.customerDuplicate).toBeNull()
  })

  it('should not report the customer with the given CRN as a duplicate of themselves', async () => {
    const response = await client.request(
      customerDuplicateQuery,
      { input: { ...details, crn: existing.crn } },
      headers
    )

    expect(response.customerDuplicate).toBeNull()
  })
})
