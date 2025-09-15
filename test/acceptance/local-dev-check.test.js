import { GraphQLClient, gql } from 'graphql-request'
import jwt from 'jsonwebtoken'

const business = {
  organisationId: '5565448',
  sbi: '107183280',
  info: {
    name: 'HENLEY, RE',
    reference: '1102179604',
    vat: 'GB123456789',
    traderNumber: '010203040506070880980',
    vendorNumber: '694523',
    address: {
      pafOrganisationName: 'FORTESCUE ESTATES',
      line1: '76 Robinswood Road',
      line2: 'UPPER CHUTE',
      line3: 'Child Okeford',
      line4: null,
      line5: null,
      buildingNumberRange: '7',
      buildingName: 'STOCKWELL HALL',
      flatName: 'THE COACH HOUSE',
      street: 'HAREWOOD AVENUE',
      city: 'DARLINGTON',
      county: 'Dorset',
      postalCode: 'CO9 3LS',
      country: 'United Kingdom',
      uprn: '10008695234',
      dependentLocality: 'ELLICOMBE',
      doubleDependentLocality: 'WOODTHORPE',
      typeId: null
    },
    correspondenceAddress: null,
    isCorrespondenceAsBusinessAddress: false,
    email: {
      address: 'henleyrej@eryelnehk.com.test',
      validated: true
    },
    correspondenceEmail: {
      address: null,
      validated: false
    },
    phone: {
      mobile: null,
      landline: '01234031859'
    },
    correspondencePhone: {
      mobile: null,
      landline: null
    },
    legalStatus: {
      code: 102111,
      type: 'Sole Proprietorship'
    },
    type: {
      code: 101443,
      type: 'Not Specified'
    },
    registrationNumbers: {
      companiesHouse: null,
      charityCommission: null
    },
    additionalSbis: ['105179439'],
    lastUpdated: '2023-07-18T15:38:20.448Z',
    isFinancialToBusinessAddress: false,
    hasLandInNorthernIreland: false,
    hasLandInScotland: false,
    hasLandInWales: false,
    hasAdditionalBusinessActivities: false,
    additionalBusinessActivities: [],
    isAccountablePeopleDeclarationCompleted: false,
    dateStartedFarming: null,
    landConfirmed: true,
    status: {
      locked: false,
      confirmed: true,
      deactivated: false
    }
  },
  customers: [
    {
      personId: '5007136',
      firstName: 'David',
      lastName: 'Paul',
      crn: '0866159801',
      role: 'Employee'
    },
    {
      personId: '5263421',
      firstName: 'Nicholas',
      lastName: 'SANGSTER',
      crn: '1638563942',
      role: 'Business Partner'
    },
    {
      personId: '5302028',
      firstName:
        'Ingrid Jerimire Klaufichus Limouhetta Mortimious Neuekind Orpheus Perimillian Quixillotrio Reviticlese',
      lastName: 'Cook',
      crn: '9477368292',
      role: 'Agent'
    },
    {
      personId: '5311964',
      firstName: 'Trevor',
      lastName: 'Graham',
      crn: '2446747270',
      role: 'Agent'
    },
    {
      personId: '5331098',
      firstName: 'Marcus',
      lastName: 'Twigden',
      crn: '4804081228',
      role: 'Agent'
    },
    {
      personId: '5778203',
      firstName: 'Oliver',
      lastName: 'Colwill',
      crn: '6148241575',
      role: 'Agent'
    }
  ],
  customer: {
    personId: '5302028',
    firstName:
      'Ingrid Jerimire Klaufichus Limouhetta Mortimious Neuekind Orpheus Perimillian Quixillotrio Reviticlese',
    lastName: 'Cook',
    crn: '9477368292',
    role: 'Agent',
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
  land: {
    summary: {
      arableLandArea: 228.2947,
      permanentCropsArea: 7.3368,
      permanentGrasslandArea: 530.1988,
      totalArea: 821.1645,
      totalParcels: 302
    },
    parcelCovers: [
      {
        id: '130',
        name: 'Permanent Grassland',
        area: 0.4829,
        code: '130',
        isBpsEligible: false
      }
    ]
  },
  countyParishHoldings: [
    {
      cphNumber: '20/060/0001',
      parish: 'WESTHAVEN',
      startDate: '2020-03-20',
      endDate: '2021-03-20',
      species: 'CATTLE,MORE THAN FIFTY POULTRY',
      xCoordinate: 572505,
      yCoordinate: 152485,
      address: 'Manor Farm, High Street, Westhaven, Devon, EX12 3AB'
    },
    {
      cphNumber: '20/060/0002',
      parish: null,
      startDate: null,
      endDate: null,
      species: null,
      xCoordinate: null,
      yCoordinate: null,
      address: null
    }
  ],
  applications: [
    {
      sbi: '107183280',
      id: '4511299240',
      subjectId: '407841902',
      year: 2022,
      name: 'COMMODO FACERE PARIATUR COGO CAREO VENTITO CONIECTO CUNABULA DEFETISCOR',
      moduleCode: 'CENTUM_UBERRIME_2022',
      scheme: 'APTO VESPER VENTUS IPSA',
      statusCodeP: 'STADOM',
      statusCodeS: '000031',
      status: 'REJECTED',
      submissionDate: '2022-12-31T18:41:23.188Z',
      portalStatusP: 'DOMPRS',
      portalStatusS: 'REJECT',
      portalStatus: 'Rejected',
      active: true,
      transitionId: '4371793806',
      transitionName: 'REJECT',
      agreementReferences: [],
      transitionHistory: [
        {
          id: '4371793806',
          name: 'REJECT',
          timestamp: '2022-12-31T02:13:05.043Z',
          checkStatus: 'PASSED'
        }
      ]
    }
  ]
}
const agreement = {
  contractId: '120809',
  name: 'CS AGREEMENT',
  status: 'SIGNED',
  contractType: 'Countryside Stewardship (MT)',
  schemeYear: 2016,
  startDate: '2017-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z'
}
const paymentSchedules = [
  {
    optionCode: 'SW2',
    optionDescription: 'SW2 - 4-6m buffer strip on intensive grassland',
    commitmentGroupStartDate: '2017-01-01T00:00:00.000Z',
    commitmentGroupEndDate: '2026-12-31T00:00:00.000Z',
    year: 2017,
    sheetName: 'NY8366',
    parcelName: '2327',
    actionArea: 1.7166,
    actionMTL: null,
    actionUnits: null,
    parcelTotalArea: 1.7166,
    startDate: '2017-01-01T00:00:00.000Z',
    endDate: '2017-12-31T00:00:00.000Z'
  }
]

const customer = {
  personId: '11111111',
  crn: '1111111100',
  info: {
    name: {
      title: 'Mr.',
      otherTitle: 'MD',
      first: 'Gerhard',
      middle: 'Shayna',
      last: 'Purdy'
    },
    dateOfBirth: '1955-04-23T21:02:16.561Z',
    phone: {
      mobile: '01650 95852',
      landline: '055 2317 9411'
    },
    email: {
      address: 'gerhard.purdy@uncommon-sideboard.org.uk',
      validated: true
    },
    status: {
      locked: false,
      confirmed: true,
      deactivated: false
    },
    address: {
      pafOrganisationName: null,
      line1: '635',
      line2: '72 Evert Green',
      line3: 'Kessler-upon-Altenwerth',
      line4: 'CO5 5GC',
      line5: 'Uzbekistan',
      buildingNumberRange: null,
      buildingName: null,
      flatName: null,
      street: null,
      city: 'Crona-on-West',
      county: null,
      postalCode: 'SV14 7HI',
      country: 'England',
      uprn: '807723943667',
      dependentLocality: null,
      doubleDependentLocality: null,
      typeId: null
    },
    doNotContact: false,
    personalIdentifiers: ['2356939974', '2348412591']
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
    messages: [
      {
        id: '8776831',
        subject: 'Accedo adfero comes avaritia ventosus argentum delectatio talus surculus fugit.',
        date: '2026-10-18T11:40:02.125Z',
        body: '<p>Strues cras triduana tempore stabilis vomica adsum culpo asporto atque.</p>',
        read: false,
        deleted: false
      },
      {
        id: '5244065',
        subject:
          'Corrumpo adulatio coadunatio bene impedit creator molestias amicitia conculco cui.',
        date: '2051-10-06T04:07:33.430Z',
        body: '<p>Stips thymbra ciminatio valens deporto magni usque absque appono repellat.</p>',
        read: false,
        deleted: false
      },
      {
        id: '8776831',
        subject: 'Accedo adfero comes avaritia ventosus argentum delectatio talus surculus fugit.',
        date: '2026-10-18T11:40:02.125Z',
        body: '<p>Strues cras triduana tempore stabilis vomica adsum culpo asporto atque.</p>',
        read: false,
        deleted: false
      },
      {
        id: '5244065',
        subject:
          'Corrumpo adulatio coadunatio bene impedit creator molestias amicitia conculco cui.',
        date: '2051-10-06T04:07:33.430Z',
        body: '<p>Stips thymbra ciminatio valens deporto magni usque absque appono repellat.</p>',
        read: false,
        deleted: false
      },
      {
        id: '8776831',
        subject: 'Accedo adfero comes avaritia ventosus argentum delectatio talus surculus fugit.',
        date: '2026-10-18T11:40:02.125Z',
        body: '<p>Strues cras triduana tempore stabilis vomica adsum culpo asporto atque.</p>',
        read: false,
        deleted: false
      },
      {
        id: '5244065',
        subject:
          'Corrumpo adulatio coadunatio bene impedit creator molestias amicitia conculco cui.',
        date: '2051-10-06T04:07:33.430Z',
        body: '<p>Stips thymbra ciminatio valens deporto magni usque absque appono repellat.</p>',
        read: false,
        deleted: false
      }
    ],
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
    isFound: false
  }
}

const businessQuery = gql`
  query Business($sbi: ID!, $crn: ID!, $date: Date, $sheetId: ID!, $parcelId: ID!) {
    business(sbi: $sbi) {
      organisationId
      sbi
      info {
        name
        reference
        vat
        traderNumber
        vendorNumber
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
        correspondenceAddress {
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
        isCorrespondenceAsBusinessAddress
        email {
          address
          validated
        }
        correspondenceEmail {
          address
          validated
        }
        phone {
          mobile
          landline
        }
        correspondencePhone {
          mobile
          landline
        }
        legalStatus {
          code
          type
        }
        type {
          code
          type
        }
        registrationNumbers {
          companiesHouse
          charityCommission
        }
        additionalSbis
        lastUpdated
        isFinancialToBusinessAddress
        hasLandInNorthernIreland
        hasLandInScotland
        hasLandInWales
        hasAdditionalBusinessActivities
        additionalBusinessActivities {
          code
          type
        }
        isAccountablePeopleDeclarationCompleted
        dateStartedFarming
        landConfirmed
        status {
          locked
          confirmed
          deactivated
        }
      }
      customers {
        personId
        firstName
        lastName
        crn
        role
      }
      customer(crn: $crn) {
        personId
        firstName
        lastName
        crn
        role
        permissionGroups {
          id
          level
          functions
        }
      }
      land {
        summary {
          arableLandArea
          permanentCropsArea
          permanentGrasslandArea
          totalArea
          totalParcels
        }
        parcelCovers(sheetId: $sheetId, parcelId: $parcelId, date: $date) {
          id
          name
          area
          code
          isBpsEligible
        }
      }
      countyParishHoldings {
        cphNumber
        parish
        startDate
        endDate
        species
        xCoordinate
        yCoordinate
        address
      }
      agreements {
        contractId
        name
        status
        contractType
        schemeYear
        startDate
        endDate
        paymentSchedules {
          optionCode
          optionDescription
          commitmentGroupStartDate
          commitmentGroupEndDate
          year
          sheetName
          parcelName
          actionArea
          actionMTL
          actionUnits
          parcelTotalArea
          startDate
          endDate
        }
      }
      applications {
        sbi
        id
        subjectId
        year
        name
        moduleCode
        scheme
        statusCodeP
        statusCodeS
        status
        submissionDate
        portalStatusP
        portalStatusS
        portalStatus
        active
        transitionId
        transitionName
        agreementReferences
        transitionHistory {
          id
          name
          timestamp
          checkStatus
        }
      }
    }
  }
`

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

describe('Local mocked dev check', () => {
  it('should support full business schema - internal', async () => {
    const client = new GraphQLClient('http://localhost:3000/graphql')
    const response = await client.request(
      businessQuery,
      {
        sbi: '107183280',
        crn: '9477368292',
        date: '2020-01-01',
        sheetId: 'SS6627',
        parcelId: '8779'
      },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject({
      ...business,
      agreements: expect.arrayContaining([
        { ...agreement, paymentSchedules: expect.arrayContaining(paymentSchedules) }
      ])
    })
  })

  it('should support full business schema - external', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '9477368292',
        relationships: ['5565448:107183280']
      },
      'test-secret'
    )
    const client = new GraphQLClient('http://localhost:3000/graphql')
    const response = await client.request(
      businessQuery,
      {
        sbi: '1111111111',
        crn: '1111111100',
        date: '2020-01-01',
        sheetId: 'SS6627',
        parcelId: '8779'
      },
      { 'x-forwarded-authorization': tokenValue, 'gateway-type': 'external' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject({
      ...business,
      agreements: expect.arrayContaining([
        { ...agreement, paymentSchedules: expect.arrayContaining(paymentSchedules) }
      ])
    })
  })

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
    expect(response.customer).toEqual(customer)
  })

  // TODO: Commented out until mock can be swapped over to V2

  // it('should support full customer schema - external', async () => {
  //   const tokenValue = jwt.sign(
  //     {
  //       contactId: '0866159801',
  //       relationships: ['5625145:107591843']
  //     },
  //     'test-secret'
  //   )
  //   const client = new GraphQLClient('http://localhost:3000/graphql')
  //   const response = await client.request(
  //     customerQuery,
  //     {
  //       sbi: '107591843',
  //       crn: '0866159801'
  //     },
  //     { 'x-forwarded-authorization': tokenValue, 'gateway-type': 'external' }
  //   )

  //   expect(response).not.toHaveProperty('errors')
  //   expect(response.customer).toEqual(customer)
  // })
})
