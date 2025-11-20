export const GET_BUSINESS_CUSTOMERS = `#graphql
  query BusinessCustomers($sbi: ID!) {
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
`

export const GET_CUSTOMER = `#graphql
  query Customer($crn: ID!, $sbi: ID!) {
    customer(crn: $crn) {
      crn
      info {
        dateOfBirth
        name {
          title
          otherTitle
          first
          middle
          last
        }
      }
      business(sbi: $sbi) {
        permissionGroups {
          id
          level
          functions
        }
        role
      }
    }
  }
`

export const GET_AUTHENTICATE_QUESTIONS = `#graphql
  query AuthenticationQuestions($crn: ID!) {
    customer(crn: $crn) {
      authenticationQuestions {
        isFound
        memorableDate
        memorableLocation
        memorableEvent
        updatedAt
      }
    }
  }
`
