import { GraphQLClient, gql } from 'graphql-request'
import jwt from 'jsonwebtoken'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const parcels = [
  {
    id: '7386091',
    sheetId: 'SS6627',
    parcelId: '5662',
    area: 1.027,
    pendingDigitisation: true
  },
  {
    id: '7386092',
    sheetId: 'SS6828',
    parcelId: '3818',
    area: 1.027,
    pendingDigitisation: false
  }
]
const agreement = [
  {
    contractId: '111111111',
    name: 'CS AGREEMENT',
    status: 'WITHDRAWN',
    contractType: 'Higher Level Stewardship',
    schemeYear: 2025,
    startDate: '2024-12-19T10:40:05.244Z',
    endDate: '2027-07-21T05:12:15.156Z',
    paymentSchedules: [
      {
        optionCode: 'LHC',
        optionDescription: 'Thema tyrannus umbra.',
        commitmentGroupStartDate: '2024-09-30T18:47:49.485Z',
        commitmentGroupEndDate: '2029-10-02T15:56:57.542Z',
        year: 2024,
        sheetName: 'CTHXRL',
        parcelName: '8415',
        actionArea: 1.5827,
        actionMTL: null,
        actionUnits: null,
        parcelTotalArea: 1.7265,
        startDate: '2023-06-04T21:47:50.970Z',
        endDate: '2027-02-27T13:54:20.492Z'
      },
      {
        optionCode: 'HKN',
        optionDescription: 'Admiratio adsum velit vaco solus.',
        commitmentGroupStartDate: '2021-08-07T19:25:05.643Z',
        commitmentGroupEndDate: '2025-03-11T12:56:17.573Z',
        year: 2025,
        sheetName: 'MNSMFA',
        parcelName: '3784',
        actionArea: 0.7996,
        actionMTL: 49,
        actionUnits: null,
        parcelTotalArea: 0.4882,
        startDate: '2016-10-27T05:38:30.882Z',
        endDate: '2026-08-21T04:14:26.468Z'
      },
      {
        optionCode: 'XXH',
        optionDescription: 'Quam ter suscipio validus.',
        commitmentGroupStartDate: '2023-07-23T08:48:37.633Z',
        commitmentGroupEndDate: '2028-06-14T08:16:08.043Z',
        year: 2024,
        sheetName: 'ZMRNDX',
        parcelName: '7795',
        actionArea: 3.1761,
        actionMTL: null,
        actionUnits: 81.41,
        parcelTotalArea: 1.0088,
        startDate: '2016-08-15T20:55:27.588Z',
        endDate: '2025-03-05T15:35:30.290Z'
      }
    ]
  }
]
const business = {
  organisationId: '111111111',
  sbi: '111111111',
  info: {
    name: 'Bechtelar - Stamm',
    reference: '2760178899',
    vat: '997364387',
    traderNumber: '535182',
    vendorNumber: null,
    address: {
      pafOrganisationName: 'Bechtelar - Stamm',
      line1: '98',
      line2: '8 Gutmann Rise',
      line3: 'North Cormier Park',
      line4: 'GK0 0XW',
      line5: 'Norfolk Island',
      buildingNumberRange: null,
      buildingName: null,
      flatName: null,
      street: null,
      city: 'Fisher Court',
      county: null,
      postalCode: 'HS26 53S',
      country: 'Scotland',
      uprn: '415400139912',
      dependentLocality: null,
      doubleDependentLocality: null,
      typeId: null
    },
    correspondenceAddress: null,
    isCorrespondenceAsBusinessAddress: false,
    email: {
      address: 'Ivah_Simonis@yahoo.com',
      validated: true
    },
    correspondenceEmail: {
      address: 'Demetris_Cartwright@hotmail.com',
      validated: false
    },
    phone: {
      mobile: '016977 8110',
      landline: '016977 9562'
    },
    correspondencePhone: {
      mobile: '016977 7045',
      landline: '056 3909 0189'
    },
    legalStatus: {
      code: 857559,
      type: 'Sole Proprietorship'
    },
    type: {
      code: 617289,
      type: 'Not Specified'
    },
    registrationNumbers: {
      companiesHouse: 'XKtocsk2',
      charityCommission: 'Ka7Kel6V'
    },
    additionalSbis: [],
    lastUpdated: '2024-12-31T22:48:44.689Z',
    isFinancialToBusinessAddress: true,
    hasLandInNorthernIreland: false,
    hasLandInScotland: false,
    hasLandInWales: true,
    hasAdditionalBusinessActivities: true,
    additionalBusinessActivities: [
      { code: 928058, type: 'Additional Business Activity 0' },
      { code: 711028, type: 'Additional Business Activity 1' },
      { code: 954131, type: 'Additional Business Activity 2' }
    ],
    isAccountablePeopleDeclarationCompleted: true,
    dateStartedFarming: '2024-09-08T10:42:10.273Z',
    landConfirmed: true,
    status: {
      locked: false,
      confirmed: false,
      deactivated: false
    }
  },
  customers: [
    {
      personId: '11111111',
      firstName: 'Raul',
      lastName: 'Feil',
      crn: '1111111100',
      role: 'Key Contact'
    },
    {
      personId: '11111112',
      firstName: 'Royce',
      lastName: 'Skiles',
      crn: '1111111200',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11111113',
      firstName: 'Jake',
      lastName: 'Balistreri',
      crn: '1111111300',
      role: 'Director'
    },
    {
      personId: '11111114',
      firstName: 'Trystan',
      lastName: 'Kirlin',
      crn: '1111111400',
      role: 'Key Contact'
    },
    {
      personId: '11111115',
      firstName: 'Shane',
      lastName: 'Berge',
      crn: '1111111500',
      role: 'Key Contact'
    },
    {
      personId: '11111116',
      firstName: 'Ellis',
      lastName: 'Cremin',
      crn: '1111111600',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11111117',
      firstName: 'Jacques',
      lastName: 'Wiegand',
      crn: '1111111700',
      role: 'Director'
    },
    {
      personId: '11111118',
      firstName: 'Rosanna',
      lastName: 'Rodriguez',
      crn: '1111111800',
      role: 'Key Contact'
    },
    {
      personId: '11111119',
      firstName: 'Big',
      lastName: 'Skeleton',
      crn: '1111111900',
      role: 'Director'
    },
    {
      personId: '11111122',
      firstName: 'Maybelle',
      lastName: 'Johns',
      crn: '1111112200',
      role: 'Agent'
    },
    {
      personId: '11111222',
      firstName: 'Jeff',
      lastName: 'Farrell',
      crn: '1111122200',
      role: 'Key Contact'
    },
    {
      personId: '11112222',
      firstName: 'Dennis',
      lastName: 'Stark',
      crn: '1111222200',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11122222',
      firstName: 'Shaniya',
      lastName: 'Stoltenberg',
      crn: '1112222200',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11222222',
      firstName: 'Virgil',
      lastName: 'Vandervort',
      crn: '1122222200',
      role: 'Key Contact'
    },
    {
      personId: '12222222',
      firstName: 'Willis',
      lastName: 'Connelly',
      crn: '1222222200',
      role: 'Owner or Sole Trader'
    }
  ],
  customer: {
    personId: '11111111',
    firstName: 'Raul',
    lastName: 'Feil',
    crn: '1111111100',
    role: 'Key Contact',
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
  land: {
    summary: {
      arableLandArea: 1.027,
      permanentCropsArea: 0,
      permanentGrasslandArea: 0,
      totalArea: 2.0541,
      totalParcels: 2
    },
    parcels: expect.arrayContaining(parcels),
    parcel: {
      id: '7386091',
      sheetId: 'SS6627',
      parcelId: '5662',
      area: 1.027,
      pendingDigitisation: true,
      effectiveToDate: '2024-09-22T13:28:07.626Z',
      effectiveFromDate: '2024-09-20T13:28:07.626Z'
    },
    parcelCovers: [
      {
        id: '11769295',
        name: 'Arable Land',
        area: 1.027,
        code: '110',
        isBpsEligible: true
      },
      {
        id: '11769235',
        name: 'Permanent Grassland',
        area: 2.541,
        code: '131',
        isBpsEligible: true
      }
    ]
  },
  agreements: expect.arrayContaining(agreement),
  applications: [
    {
      sbi: '111111111',
      id: '4370008780',
      subjectId: '620008135',
      year: 2022,
      name: 'TYRANNUS UMBRA VOLUPTATEM VIRGA CONTRA IURE USQUE SED VIRGO',
      moduleCode: 'TUM_CULTELLUS_AUTUS_2022',
      scheme: 'COMPREHENDO ADVERSUS CONATUS TURBO',
      statusCodeP: 'STADOM',
      statusCodeS: '000002',
      status: 'DELETED',
      submissionDate: null,
      portalStatusP: 'DOMPRS',
      portalStatusS: null,
      portalStatus: null,
      active: true,
      transitionId: '6470349421',
      transitionName: 'DELETE',
      agreementReferences: ['6633536845'],
      transitionHistory: [
        {
          id: '6470349421',
          name: 'DELETE',
          timestamp: '2022-12-31T00:54:50.310Z',
          checkStatus: 'PASSED'
        }
      ]
    }
  ],
  countyParishHoldings: [
    {
      cphNumber: '01/788/9935',
      parish: 'Spixworth',
      startDate: '2021-04-21',
      endDate: '2028-04-21',
      species: 'PIG(S),PIGEONS,CATTLE,POULTRY,SHEEP,OTHER,CAMELIDS,GOAT(S)',
      xCoordinate: 98337,
      yCoordinate: 733971,
      address: 'ARCESSO SUBNECTO FARM, ANNIE SIDE, BATZ-LE-HERMANN, DY65 37V'
    }
  ]
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
        parcels(date: $date) {
          id
          sheetId
          parcelId
          area
          pendingDigitisation
        }
        parcel(sheetId: $sheetId, parcelId: $parcelId, date: $date) {
          id
          sheetId
          parcelId
          area
          pendingDigitisation
          effectiveToDate
          effectiveFromDate
        }
        parcelCovers(sheetId: $sheetId, parcelId: $parcelId, date: $date) {
          id
          name
          area
          code
          isBpsEligible
        }
        parcelLandUses(sheetId: $sheetId, parcelId: $parcelId, date: $date) {
          code
          startDate
          endDate
          insertDate
          deleteDate
          area
          length
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
const businessVariables = {
  sbi: '111111111',
  crn: '1111111100',
  date: '2025-05-04',
  sheetId: 'SS6627',
  parcelId: '5662'
}

describe('Local mocked dev check', () => {
  it('should support full business schema - internal', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(businessQuery, businessVariables, {
      email: 'some-email',
      'gateway-type': 'internal'
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject(business)
  })

  it('should support full business schema - external', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '11111111',
        relationships: ['111111111:111111111']
      },
      'test-secret'
    )
    const client = new GraphQLClient(targetURL)
    const response = await client.request(businessQuery, businessVariables, {
      'x-forwarded-authorization': tokenValue,
      'gateway-type': 'external'
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject(business)
  })
})
