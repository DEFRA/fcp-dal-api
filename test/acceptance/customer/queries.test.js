import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'

const customerQuery = gql`
  query Customer($crn: ID!, $sbi: ID!) {
    customer(crn: $crn) {
      personId
      crn
      info {
        name {
          title
          otherTitle
          first
          middle
          last
        }
        dateOfBirth
        phone {
          mobile
          landline
        }
        email {
          address
          validated
        }
        status {
          locked
          confirmed
          deactivated
        }
        address {
          pafOrganisationName
          line1
          line2
          line3
          line4
          line5
          buildingNumberRange
          buildingName
          flatName
          street
          city
          county
          postalCode
          country
          uprn
          dependentLocality
          doubleDependentLocality
          typeId
        }
        doNotContact
        personalIdentifiers
      }
      businesses {
        name
        organisationId
        sbi
      }
      business(sbi: $sbi) {
        organisationId
        sbi
        name
        role
        messages {
          id
          subject
          date
          body
          read
          deleted
        }
        permissionGroups {
          id
          level
          functions
        }
      }
      authenticationQuestions {
        memorableDate
        memorableEvent
        memorableLocation
        updatedAt
        isFound
      }
    }
  }
`

const customer = {
  personId: '11111111',
  crn: '1111111100',
  info: {
    name: {
      title: 'Mrs.',
      otherTitle: 'I',
      first: 'Lauren',
      middle: 'Daryl',
      last: 'Sanford'
    },
    dateOfBirth: '1972-11-23',
    phone: {
      mobile: '056 8967 5108',
      landline: '055 4582 4488'
    },
    email: {
      address: 'lauren.sanford@immaculate-shark.info',
      validated: false
    },
    status: {
      locked: false,
      confirmed: false,
      deactivated: false
    },
    address: {
      pafOrganisationName: null,
      line1: '65',
      line2: '1 McCullough Path',
      line3: 'Newton Ratkedon',
      line4: 'MS9 8BJ',
      line5: 'North Macedonia',
      buildingNumberRange: null,
      buildingName: null,
      flatName: null,
      street: null,
      city: 'Newton Bruen',
      county: null,
      postalCode: 'TC2 8KP',
      country: 'Wales',
      uprn: '790214962932',
      dependentLocality: null,
      doubleDependentLocality: null,
      typeId: null
    },
    doNotContact: false,
    personalIdentifiers: ['8568845789', '370030956', '7899566034']
  },
  businesses: [
    {
      name: 'Maggio, Murray and Dicki',
      organisationId: '1111111111',
      sbi: '1111111111'
    }
  ],
  business: {
    organisationId: '1111111111',
    sbi: '1111111111',
    name: 'Maggio, Murray and Dicki',
    role: 'Business Partner',
    permissionGroups: [
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'SUBMIT',
        functions: [
          'View business summary',
          'View claims',
          'View land, features and covers',
          'Create and edit a claim',
          'Amend a previously submitted claim',
          'Amend land, features and covers',
          'Submit a claim',
          'Withdraw a claim',
          'Receive warnings and notifications'
        ]
      },
      {
        id: 'BUSINESS_DETAILS',
        level: 'FULL_PERMISSION',
        functions: [
          'View business details',
          'View people associated with the business',
          'Amend business and correspondence contact details',
          'Amend controlled information, such as business name',
          'Confirm business details',
          'Amend bank account details',
          'Make young/new farmer declaration',
          'Add someone to the business',
          'Give permissions on business'
        ]
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
        level: 'SUBMIT',
        functions: [
          'View CS Agreements',
          'View Land, Features and Cover',
          'View CS Agreement amendments',
          'View CS agreement Transfers',
          'View CS Claims',
          'Amend land, Features and Covers',
          'Create and edit a CS claim',
          'Amend a previously submitted claim',
          'Create and edit a CS agreement Amendment',
          'Revise a previously submitted agreement amendment',
          'Create and Edit a CS agreement transfer',
          'Revise a previously submitted agreement transfer',
          'Submit Acceptance of CS Agreement offer',
          'Submit rejection of CS agreement offer',
          'Submit (and resubmit) a CS claim',
          'Withdraw a CS claim',
          'Submit (and resubmit) a CS agreement amendment',
          'Withdraw a CS agreement amendment',
          'Submit (and resubmit) a CS agreement transfer',
          'Withdraw a CS agreement transfer',
          'Receive warnings and notifications'
        ]
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
        level: 'SUBMIT',
        functions: [
          'View CS Scheme eligibility',
          'View Applications',
          'View land, features and covers',
          'View CS agreement offer',
          'View draft CS Agreements',
          'Create and edit a CS application',
          'Amend a previously submitted CS application',
          'Amend Land, Features and Covers',
          'Submit CS Application',
          'Withdraw CS application',
          'Receive warnings and notifications'
        ]
      },
      {
        id: 'ENTITLEMENTS',
        level: 'AMEND',
        functions: ['View entitlements', 'Transfer entitlements', 'Apply for new entitlements']
      },
      {
        id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
        level: 'SUBMIT',
        functions: [
          'View Environmental Land Management scheme eligibility',
          'View Environmental Land Management applications',
          'View land, features and covers',
          'View Environmental Land Management agreement offer',
          'View Environmental Land Management agreements',
          'Create and edit a Environmental Land Management application',
          'Amend (but not resubmit) a previously submitted Environmental Land Management application',
          'Amend land, features and covers',
          'Submit Environmental Land Management application',
          'Withdraw Environmental Land Management application',
          'Submit acceptance of Environmental Land Management agreement offer',
          'Submit rejection of Environmental Land Management agreement offer',
          'Receive all application correspondence including all warnings and notifications'
        ]
      },
      {
        id: 'LAND_DETAILS',
        level: 'AMEND',
        functions: [
          'View land, features and covers',
          'Amend land, features and covers',
          'Transfer land'
        ]
      }
    ]
  },
  authenticationQuestions: {
    memorableDate: null,
    memorableEvent: null,
    memorableLocation: null,
    updatedAt: null,
    isFound: true
  }
}
const messages = [
  {
    id: '6070061621',
    subject: 'Ocer uredo caecus tantillus.',
    date: '2024-01-28T03:48:38.540Z',
    body: '<p>Averto veniam suus cotidie arbor strues delectatio arx.</p>',
    read: true,
    deleted: false
  },
  {
    id: '7363663048',
    subject: 'Absconditus tergo mollitia at tempore.',
    date: '2024-06-18T22:03:32.049Z',
    body: '<p>Clamo corona brevis conventus quis alveus cattus amaritudo coadunatio maxime.</p>',
    read: true,
    deleted: false
  }
]

describe('Customer Queries', () => {
  it('should support full customer schema - internal', async () => {
    const client = new GraphQLClient('http://localhost:3000/graphql')
    const response = await client.request(
      customerQuery,
      {
        sbi: '1111111111',
        crn: '1111111100'
      },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.customer).toEqual({
      ...customer,
      business: { ...customer.business, messages: expect.arrayContaining(messages) }
    })
  })

  it('should support full customer schema - external', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '1111111100',
        relationships: ['1111111111:1111111111']
      },
      'test-secret'
    )
    const client = new GraphQLClient('http://localhost:3000/graphql')
    const response = await client.request(
      customerQuery,
      {
        sbi: '1111111111',
        crn: '1111111100'
      },
      { 'x-forwarded-authorization': tokenValue, 'gateway-type': 'external' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.customer).toEqual({
      ...customer,
      business: { ...customer.business, messages: expect.arrayContaining(messages) }
    })
  })
})
