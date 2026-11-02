import { GraphQLClient, gql } from 'graphql-request'
import jwt from 'jsonwebtoken'

import { describe, expect, it } from 'vitest'
const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const parcels = [
  {
    id: '7386091',
    sheetId: 'TE0001',
    parcelId: '1001',
    area: 1.027,
    pendingDigitisation: true
  },
  {
    id: '7386092',
    sheetId: 'TE0002',
    parcelId: '1002',
    area: 1.027,
    pendingDigitisation: false
  }
]
const agreement = [
  {
    contractId: '111111111',
    name: 'ELS AGREEMENT',
    status: 'EXPIRED',
    contractType: 'Higher Level Stewardship',
    schemeYear: 2025,
    startDate: '2019-10-14T01:13:42.605Z',
    endDate: '2025-12-21T08:35:46.028Z',
    paymentSchedules: [
      {
        optionCode: 'VCW',
        optionDescription: 'Thymbra adinventitias coma abstergo.',
        commitmentGroupStartDate: '2017-08-17T14:21:58.223Z',
        commitmentGroupEndDate: '2028-03-28T13:49:01.225Z',
        year: 2024,
        sheetName: 'SWWWGO',
        parcelName: '8302',
        actionArea: 2.8695,
        actionMTL: null,
        actionUnits: null,
        parcelTotalArea: 4.549,
        startDate: '2015-12-03T23:03:01.827Z',
        endDate: '2027-06-15T16:05:06.490Z'
      },
      {
        optionCode: 'MWZ',
        optionDescription: 'Adaugeo cras sui adulescens carbo copia thalassinus.',
        commitmentGroupStartDate: '2018-02-17T20:22:33.325Z',
        commitmentGroupEndDate: '2029-06-16T05:59:14.764Z',
        year: 2025,
        sheetName: 'UZVEKQ',
        parcelName: '0872',
        actionArea: 2.7426,
        actionMTL: 38,
        actionUnits: 98.58,
        parcelTotalArea: 3.8981,
        startDate: '2022-07-29T07:40:50.428Z',
        endDate: '2025-01-17T14:47:29.747Z'
      },
      {
        optionCode: 'TFT',
        optionDescription: 'Tero consuasor magnam.',
        commitmentGroupStartDate: '2022-11-02T21:18:27.309Z',
        commitmentGroupEndDate: '2026-06-19T22:03:47.493Z',
        year: 2025,
        sheetName: 'MFAQUV',
        parcelName: '5183',
        actionArea: 3.4577,
        actionMTL: 33,
        actionUnits: 64.28,
        parcelTotalArea: 3.6959,
        startDate: '2017-12-29T05:04:25.979Z',
        endDate: '2026-12-24T18:30:23.080Z'
      }
    ]
  }
]
const business = {
  organisationId: '111111111',
  sbi: '811111111',
  info: {
    name: 'Bechtelar - Stamm',
    frn: '2760178899',
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
      crn: '9111111100',
      role: 'Key Contact'
    },
    {
      personId: '11111112',
      firstName: 'Royce',
      lastName: 'Skiles',
      crn: '9111111200',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11111113',
      firstName: 'Jake',
      lastName: 'Balistreri',
      crn: '9111111300',
      role: 'Director'
    },
    {
      personId: '11111114',
      firstName: 'Trystan',
      lastName: 'Kirlin',
      crn: '9111111400',
      role: 'Key Contact'
    },
    {
      personId: '11111115',
      firstName: 'Shane',
      lastName: 'Berge',
      crn: '9111111500',
      role: 'Key Contact'
    },
    {
      personId: '11111116',
      firstName: 'Ellis',
      lastName: 'Cremin',
      crn: '9111111600',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11111117',
      firstName: 'Jacques',
      lastName: 'Wiegand',
      crn: '9111111700',
      role: 'Director'
    },
    {
      personId: '11111118',
      firstName: 'Rosanna',
      lastName: 'Rodriguez',
      crn: '9111111800',
      role: 'Key Contact'
    },
    {
      personId: '11111119',
      firstName: 'Big',
      lastName: 'Skeleton',
      crn: '9111111900',
      role: 'Director'
    },
    {
      personId: '11111122',
      firstName: 'Maybelle',
      lastName: 'Johns',
      crn: '9111112200',
      role: 'Agent'
    },
    {
      personId: '11111222',
      firstName: 'Jeff',
      lastName: 'Farrell',
      crn: '9111122200',
      role: 'Key Contact'
    },
    {
      personId: '11112222',
      firstName: 'Dennis',
      lastName: 'Stark',
      crn: '9111222200',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11122222',
      firstName: 'Shaniya',
      lastName: 'Stoltenberg',
      crn: '9112222200',
      role: 'Owner or Sole Trader'
    },
    {
      personId: '11222222',
      firstName: 'Virgil',
      lastName: 'Vandervort',
      crn: '9122222200',
      role: 'Key Contact'
    },
    {
      personId: '12222222',
      firstName: 'Willis',
      lastName: 'Connelly',
      crn: '9222222200',
      role: 'Owner or Sole Trader'
    }
  ],
  customer: {
    personId: '11111111',
    firstName: 'Raul',
    lastName: 'Feil',
    crn: '9111111100',
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
      sheetId: 'TE0001',
      parcelId: '1001',
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
    ],
    parcelLandUses: [
      {
        code: 'WO25',
        type: 'RESIDENTIAL',
        campaign: 2024,
        startDate: '2023-09-08T21:29:16.731Z',
        endDate: '2027-07-23T15:13:19.322Z',
        insertDate: '2023-09-23T20:30:10.440Z',
        deleteDate: '9999-12-31T00:00:00.000Z',
        area: 0.0218,
        length: 53
      }
    ]
  },
  agreements: expect.arrayContaining(agreement),
  applications: [
    {
      sbi: '811111111',
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
      cphNumber: '77/338/9329',
      parish: 'Barrowden',
      startDate: '2023-09-23',
      endDate: '9999-12-31',
      species: 'PIG(S),SHEEP,POULTRY,GOAT(S),CAMELIDS,OTHER,DEER,CATTLE',
      xCoordinate: 318723,
      yCoordinate: 854985,
      address: 'CURRUS REICIENDIS FARM, THE RIDINGS, LITTLE FERRY, DY9 0MG'
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
        frn
        reference
        frn
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
        summary(date: $date) {
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
          type
          campaign
          startDate
          endDate
          insertDate
          deleteDate
          area
          length
          type
          campaign
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
  sbi: '811111111',
  crn: '9111111100',
  date: '2025-05-04',
  sheetId: 'TE0001',
  parcelId: '1001'
}

describe('Local mocked dev check', () => {
  it('should support full business schema - internal', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(businessQuery, businessVariables, {
      email: 'some-email'
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject(business)
  })

  it('should support full business schema - external', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '11111111',
        relationships: ['111111111:811111111']
      },
      'test-secret'
    )
    const client = new GraphQLClient(targetURL)
    const response = await client.request(businessQuery, businessVariables, {
      'x-forwarded-authorization': tokenValue
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject(business)
  })

  it('should return the dal-service response header', async () => {
    const client = new GraphQLClient(targetURL)
    const { headers } = await client.rawRequest(businessQuery, businessVariables, {
      email: 'some-email'
    })

    // Injected from SERVICE_VERSION environment variable
    expect(headers.get('x-dal-service-version')).toBe('0.0.0')
  })
})
