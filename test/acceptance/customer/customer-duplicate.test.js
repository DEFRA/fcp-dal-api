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

  describe.each([
    ['GMT', '1974-03-05'],
    ['BST', '1974-07-05']
  ])('with a date of birth in %s', (_, dateOfBirth) => {
    const seasonal = {
      first: 'Duplicate',
      last: `Check-${dateOfBirth}-${Date.now()}`,
      dateOfBirth,
      phone: { mobile: '07700 900124', landline: null }
    }
    let created

    beforeAll(async () => {
      const response = await client.request(createCustomerMutation, { input: seasonal }, headers)
      created = response.createCustomer.customer
    })

    it('should match on the same date of birth', async () => {
      const response = await client.request(customerDuplicateQuery, { input: seasonal }, headers)

      expect(response.customerDuplicate).toEqual(
        expect.objectContaining({ crn: created.crn, dateOfBirth })
      )
    })

    it.each([
      ['the day before', -1],
      ['the day after', 1]
    ])('should not match on %s', async (__, offset) => {
      const date = new Date(`${dateOfBirth}T00:00:00Z`)
      date.setUTCDate(date.getUTCDate() + offset)

      const response = await client.request(
        customerDuplicateQuery,
        { input: { ...seasonal, dateOfBirth: date.toISOString().slice(0, 10) } },
        headers
      )

      expect(response.customerDuplicate).toBeNull()
    })
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
