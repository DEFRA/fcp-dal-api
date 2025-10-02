import { GraphQLClient, gql } from 'graphql-request'
import jwt from 'jsonwebtoken'

const parcels = [
  {
    id: '6919136',
    sheetId: 'SS6830',
    parcelId: '3649',
    area: 0.3429,
    pendingDigitisation: true
  },
  {
    id: '6772251',
    sheetId: 'SS6629',
    parcelId: '4244',
    area: 0.4269,
    pendingDigitisation: false
  }
]
const agreement = [
  {
    contractId: '1111111111',
    name: 'ELS AGREEMENT',
    status: 'ACTIVE',
    contractType: 'Countryside Stewardship (MT)',
    schemeYear: 2024,
    startDate: '2019-06-04T00:00:00.000Z',
    endDate: '2026-07-30T00:00:00.000Z',
    paymentSchedules: [
      {
        optionCode: 'ZWY',
        optionDescription: 'Cunabula agnitio cur demo acer sit.',
        commitmentGroupStartDate: '2022-09-11T00:00:00.000Z',
        commitmentGroupEndDate: '2026-06-12T00:00:00.000Z',
        year: 2025,
        sheetName: 'FBLUEA',
        parcelName: '6797',
        actionArea: 0.1128,
        actionMTL: null,
        actionUnits: 66,
        parcelTotalArea: 2.3776,
        startDate: '2018-03-07T00:00:00.000Z',
        endDate: '2026-05-10T00:00:00.000Z'
      },
      {
        optionCode: 'HJZ',
        optionDescription: 'Abbas eaque solus commodi defessus.',
        commitmentGroupStartDate: '2019-03-23T00:00:00.000Z',
        commitmentGroupEndDate: '2029-09-12T00:00:00.000Z',
        year: 2025,
        sheetName: 'YVKIGZ',
        parcelName: '1425',
        actionArea: 1.8288,
        actionMTL: 78,
        actionUnits: null,
        parcelTotalArea: 3.0861,
        startDate: '2022-11-06T00:00:00.000Z',
        endDate: '2025-04-03T00:00:00.000Z'
      },
      {
        optionCode: 'DZC',
        optionDescription: 'Sint colligo tabula capitulus.',
        commitmentGroupStartDate: '2018-10-29T00:00:00.000Z',
        commitmentGroupEndDate: '2029-09-01T00:00:00.000Z',
        year: 2024,
        sheetName: 'EUANGB',
        parcelName: '0019',
        actionArea: 0.3114,
        actionMTL: 19,
        actionUnits: 16,
        parcelTotalArea: 1.6253,
        startDate: '2021-04-26T00:00:00.000Z',
        endDate: '2027-04-08T00:00:00.000Z'
      }
    ]
  }
]
const business = {
  organisationId: '1111111111',
  sbi: '1111111111',
  info: {
    name: 'Maggio, Murray and Dicki',
    reference: '5305137528',
    vat: '2272858234',
    traderNumber: '338653',
    vendorNumber: null,
    address: {
      pafOrganisationName: 'Maggio, Murray and Dicki',
      line1: '14',
      line2: '16 Fourth Avenue',
      line3: 'Miller-under-Raynor',
      line4: 'XP0 6TX',
      line5: 'Saint Helena',
      buildingNumberRange: null,
      buildingName: null,
      flatName: null,
      street: null,
      city: 'South Witting Green',
      county: null,
      postalCode: 'IH1 1MM',
      country: 'England',
      uprn: '563449849116',
      dependentLocality: null,
      doubleDependentLocality: null,
      typeId: null
    },
    correspondenceAddress: null,
    isCorrespondenceAsBusinessAddress: false,
    email: {
      address: 'Joe_Pollich@gmail.com',
      validated: true
    },
    correspondenceEmail: {
      address: 'Anita4@hotmail.com',
      validated: true
    },
    phone: {
      mobile: '0800 008521',
      landline: '010952 63723'
    },
    correspondencePhone: {
      mobile: '0800 531443',
      landline: '0813 645 0023'
    },
    legalStatus: {
      code: 671956,
      type: 'Sole Proprietorship'
    },
    type: {
      code: 962248,
      type: 'Not Specified'
    },
    registrationNumbers: {
      companiesHouse: 'yPDmr5q7',
      charityCommission: 'UtKAQapw'
    },
    additionalSbis: [],
    lastUpdated: '2024-12-31T23:45:32.357Z',
    isFinancialToBusinessAddress: false,
    hasLandInNorthernIreland: false,
    hasLandInScotland: false,
    hasLandInWales: true,
    hasAdditionalBusinessActivities: false,
    additionalBusinessActivities: [],
    isAccountablePeopleDeclarationCompleted: false,
    dateStartedFarming: '2024-10-24T21:25:07.247Z',
    landConfirmed: true,
    status: {
      locked: false,
      confirmed: true,
      deactivated: false
    }
  },
  customers: [
    {
      personId: '11111111',
      firstName: 'Lauren',
      lastName: 'Sanford',
      crn: '1111111100',
      role: 'Business Partner'
    },
    {
      personId: '11111112',
      firstName: 'Kristy',
      lastName: 'Stiedemann',
      crn: '1111111200',
      role: 'Business Partner'
    },
    {
      personId: '11111113',
      firstName: 'Marco',
      lastName: 'Kovacek',
      crn: '1111111300',
      role: 'Business Partner'
    },
    {
      personId: '11111114',
      firstName: 'Henri',
      lastName: 'Weissnat',
      crn: '1111111400',
      role: 'Business Partner'
    },
    {
      personId: '11111115',
      firstName: 'Terry',
      lastName: 'Swaniawski',
      crn: '1111111500',
      role: 'Business Partner'
    },
    {
      personId: '11111116',
      firstName: 'Juwan',
      lastName: 'Hahn',
      crn: '1111111600',
      role: 'Business Partner'
    },
    {
      personId: '11111117',
      firstName: 'Frederic',
      lastName: 'Koch-Cassin',
      crn: '1111111700',
      role: 'Business Partner'
    },
    {
      personId: '11111118',
      firstName: 'Mara',
      lastName: 'Stark',
      crn: '1111111800',
      role: 'Business Partner'
    },
    {
      personId: '11111119',
      firstName: 'Murray',
      lastName: 'Kihn',
      crn: '1111111900',
      role: 'Business Partner'
    },
    {
      personId: '11111122',
      firstName: 'Rod',
      lastName: 'Quitzon-Gibson',
      crn: '1111112200',
      role: 'Business Partner'
    },
    {
      personId: '11111222',
      firstName: 'Nayeli',
      lastName: 'Kub',
      crn: '1111122200',
      role: 'Business Partner'
    },
    {
      personId: '11112222',
      firstName: 'Kellie',
      lastName: 'Flatley',
      crn: '1111222200',
      role: 'Business Partner'
    },
    {
      personId: '11122222',
      firstName: 'Meaghan',
      lastName: 'Torp',
      crn: '1112222200',
      role: 'Business Partner'
    },
    {
      personId: '11222222',
      firstName: 'Stacey',
      lastName: 'Willms',
      crn: '1122222200',
      role: 'Business Partner'
    },
    {
      personId: '12222222',
      firstName: 'Vilma',
      lastName: 'Yundt',
      crn: '1222222200',
      role: 'Business Partner'
    }
  ],
  customer: {
    personId: '11111111',
    firstName: 'Lauren',
    lastName: 'Sanford',
    crn: '1111111100',
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
  land: {
    summary: {
      arableLandArea: 9.1844,
      permanentCropsArea: 0.4886,
      permanentGrasslandArea: 7.9759,
      totalArea: 23.3594,
      totalParcels: 11
    },
    parcels: expect.arrayContaining(parcels),
    parcel: {
      id: '6919136',
      sheetId: 'SS6830',
      parcelId: '3649',
      area: 0.3429,
      pendingDigitisation: true,
      effectiveToDate: '2024-06-04T08:02:01.902Z',
      effectiveFromDate: '2024-06-02T08:02:01.902Z'
    },
    parcelCovers: [
      {
        id: '10316094',
        name: 'Woodland',
        area: 0.3429,
        code: '332',
        isBpsEligible: false
      }
    ]
  },
  agreements: expect.arrayContaining(agreement),
  applications: [
    {
      sbi: '1111111111',
      id: '5836775937',
      subjectId: '1998217138',
      year: 2022,
      name: 'VOX CURRUS DELEO PEIOR CUNABULA AGNITIO CUR DEMO',
      moduleCode: null,
      scheme: 'CIVITAS THECA PAUCI ACER SUNT VALETUDO',
      statusCodeP: null,
      statusCodeS: '000090',
      status: 'PAID',
      submissionDate: '2022-12-31T22:01:36.356Z',
      portalStatusP: 'DOMPRS',
      portalStatusS: null,
      portalStatus: null,
      active: true,
      transitionId: '6338450300',
      transitionName: 'TO PAID',
      agreementReferences: ['3242226112'],
      transitionHistory: [
        {
          id: '6338450300',
          name: 'TO PAID',
          timestamp: '2022-12-31T06:30:16.953Z',
          checkStatus: 'PASSED'
        }
      ]
    }
  ],
  countyParishHoldings: [
    {
      cphNumber: '14/794/4640',
      parish: 'Fulbeck',
      startDate: '2023-07-02',
      endDate: '9999-12-31',
      species: 'SHEEP,CATTLE,GOAT(S),POULTRY,DEER,PIGEONS',
      xCoordinate: 0,
      yCoordinate: 0,
      address: 'NIHIL ACCOMMODO PORRO FARM, WEST END, ABERNATHY-LE-WITTING, MI21 1MM'
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
  sbi: '1111111111',
  crn: '1111111100',
  date: '2025-05-04',
  sheetId: 'SS6830',
  parcelId: '3649'
}

describe('Local mocked dev check', () => {
  it('should support full business schema - internal', async () => {
    const client = new GraphQLClient('http://localhost:3000/graphql')
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
        relationships: ['1111111111:1111111111']
      },
      'test-secret'
    )
    const client = new GraphQLClient('http://localhost:3000/graphql')
    const response = await client.request(businessQuery, businessVariables, {
      'x-forwarded-authorization': tokenValue,
      'gateway-type': 'external'
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject(business)
  })
})
