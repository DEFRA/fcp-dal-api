import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

// `agreements` is one of the Business fields that, for an externally authenticated request, is
// resolved via the DAL's own service account rather than the caller's Defra ID token (see
// useServiceAccountForExternal in app/graphql/resolvers/business/common.js). That routing must
// never let a request with an invalid Defra ID token slip through on the service account's
// credentials - the token is verified once, eagerly, during context build
// (app/auth/defra-id.js), before any data source - including the service-account one - is ever
// constructed.
const businessAgreementsQuery = gql`
  query Business($sbi: ID!) {
    business(sbi: $sbi) {
      sbi
      agreements {
        contractId
        name
        status
      }
    }
  }
`

describe('Business Queries - DAL service account routing', () => {
  const client = new GraphQLClient(targetURL)

  it('resolves a service-account-routed field for a valid authenticated external request', async () => {
    const tokenValue = jwt.sign(
      { contactId: '1111111100', relationships: ['111111111:111111111'] },
      'test-secret'
    )

    const response = await client.request(
      businessAgreementsQuery,
      { sbi: '111111111' },
      { 'x-forwarded-authorization': tokenValue }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business.sbi).toBe('111111111')
    expect(response.business.agreements.length).toBeGreaterThan(0)
  })

  it('rejects the whole request when the Defra ID token is invalid, rather than falling through to the DAL service account', async () => {
    await expect(
      client.request(
        businessAgreementsQuery,
        { sbi: '111111111' },
        { 'x-forwarded-authorization': 'not-a-jwt' }
      )
    ).rejects.toMatchObject({
      response: {
        status: 401,
        errors: [
          expect.objectContaining({
            extensions: expect.objectContaining({ code: 'UNAUTHORIZED' })
          })
        ]
      }
    })
  })
})

const headers = { email: 'some-email' }

describe('Business Queries - bankAccounts', () => {
  const client = new GraphQLClient(targetURL)
  const bankAccountsQuery = gql`
    query BusinessBankAccounts($sbi: ID!) {
      business(sbi: $sbi) {
        bankAccounts {
          number
          currency
        }
      }
    }
  `

  it('returns the existing bank accounts held for the business', async () => {
    // org 222222222 has static existing accounts in the mock
    const response = await client.request(bankAccountsQuery, { sbi: '222222222' }, headers)

    expect(response.business.bankAccounts).toEqual([
      { number: '1234', currency: 'GBP' },
      { number: '5678', currency: 'EUR' }
    ])
  })

  it('returns an empty list when the business has no bank accounts', async () => {
    const response = await client.request(bankAccountsQuery, { sbi: '111111111' }, headers)

    expect(response.business.bankAccounts).toEqual([])
  })
})

describe('Business Queries - permittedFunctions', () => {
  const client = new GraphQLClient(targetURL)
  const permittedFunctionsQuery = gql`
    query BusinessPermittedFunctions($sbi: ID!, $functions: [String!]!) {
      business(sbi: $sbi) {
        permittedFunctions(functions: $functions) {
          name
          permitted
        }
      }
    }
  `

  it('returns whether the external user is permitted each requested function for the business', async () => {
    const tokenValue = jwt.sign(
      { contactId: '1111111100', relationships: ['111111111:111111111'] },
      'test-secret'
    )

    const response = await client.request(
      permittedFunctionsQuery,
      {
        sbi: '111111111',
        functions: ['viewLand', 'amendBankAccountDetails', 'closeBusiness', 'someBrandNewFunction']
      },
      { 'x-forwarded-authorization': tokenValue }
    )

    expect(response.business.permittedFunctions).toEqual([
      { name: 'viewLand', permitted: false },
      { name: 'amendBankAccountDetails', permitted: false },
      { name: 'closeBusiness', permitted: true },
      // unrecognised function names are echoed back as not permitted
      { name: 'someBrandNewFunction', permitted: false }
    ])
  })
})

describe('Business Queries - payments', () => {
  const client = new GraphQLClient(targetURL)
  const paymentsQuery = gql`
    query BusinessPayments($sbi: ID!, $userIP: String!, $fromDate: Date, $toDate: Date) {
      business(sbi: $sbi) {
        payments(userIP: $userIP, fromDate: $fromDate, toDate: $toDate) {
          onHold
          payments {
            reference
            date
            amount
            currency
            lineItems {
              agreementNumber
              claimReferenceNumber
              scheme
              marketingYear
              description
              amount
            }
          }
        }
      }
    }
  `

  it('returns the payments made to the business', async () => {
    const response = await client.request(
      paymentsQuery,
      { sbi: '111111111', userIP: '127.0.0.1' },
      headers
    )

    const { onHold, payments } = response.business.payments
    expect(onHold).toBe(false)
    expect(payments).toHaveLength(25)
    expect(payments[0]).toEqual({
      reference: 'PY8078532',
      date: '2020-03-15',
      amount: 21858.12,
      currency: 'GBP',
      lineItems: [
        {
          agreementNumber: 'Z1439793',
          claimReferenceNumber: '7138384183',
          scheme: '6168',
          marketingYear: '2024',
          description: 'Condico utor abscido varius derelinquo patruus comburo.',
          amount: 6979.48
        },
        {
          agreementNumber: 'R3552433',
          claimReferenceNumber: '7510608535',
          scheme: '170',
          marketingYear: '2024',
          description:
            'Triumphus vobis aliquid similique apud textus pax clementia administratio approbo.',
          amount: 1620.89
        },
        {
          agreementNumber: 'Q4190772',
          claimReferenceNumber: '7949750534',
          scheme: '109315',
          marketingYear: '2024',
          description: 'Vulgo utilis vix sint perspiciatis tredecim.',
          amount: 2102.53
        },
        {
          agreementNumber: 'K2990517',
          claimReferenceNumber: '159897353',
          scheme: '407',
          marketingYear: '2024',
          description: 'Conscendo ocer somniculosus universe veritatis utroque ait.',
          amount: 8785.88
        },
        {
          agreementNumber: 'U0938415',
          claimReferenceNumber: '6784873429',
          scheme: '424949',
          marketingYear: '2024',
          description: 'Demens contra aqua velut sublime.',
          amount: 2369.34
        }
      ]
    })
  })

  it('returns only the payments within the fromDate and toDate range', async () => {
    const response = await client.request(
      paymentsQuery,
      { sbi: '111111111', userIP: '127.0.0.1', fromDate: '2020-03-01', toDate: '2020-06-30' },
      headers
    )

    const { onHold, payments } = response.business.payments
    expect(onHold).toBe(false)
    expect(payments.map(({ reference, date }) => ({ reference, date }))).toEqual([
      { reference: 'PY8078532', date: '2020-03-15' },
      { reference: 'PY5991396', date: '2020-06-15' }
    ])
  })

  it('rejects an invalid date filter', async () => {
    await expect(
      client.request(
        paymentsQuery,
        { sbi: '111111111', userIP: '127.0.0.1', fromDate: 'not-a-date' },
        headers
      )
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message:
              'Invalid date format: "not-a-date" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01',
            extensions: expect.objectContaining({ code: 'BAD REQUEST' })
          })
        ]
      }
    })
  })

  it('returns no payments when the business has none', async () => {
    // org 100000000 has no payments in the mock
    const response = await client.request(
      paymentsQuery,
      { sbi: '100000000', userIP: '127.0.0.1' },
      headers
    )

    expect(response.business.payments).toEqual({ onHold: false, payments: [] })
  })
})
