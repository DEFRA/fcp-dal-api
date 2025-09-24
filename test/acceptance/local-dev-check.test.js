import { GraphQLClient, gql } from 'graphql-request'
import jwt from 'jsonwebtoken'

const business = {
  organisationId: '1111111111',
  sbi: '1111111111',
  info: {
    name: 'Lowe - Wolf',
    reference: '2962772615',
    vat: '9039452915',
    traderNumber: null,
    vendorNumber: null,
    address: {
      pafOrganisationName: 'Lowe - Wolf',
      line1: '51',
      line2: '527 Alicia Bank',
      line3: 'Kiehn-over-Mosciski',
      line4: 'XP4 7DL',
      line5: 'Puerto Rico',
      buildingNumberRange: null,
      buildingName: null,
      flatName: null,
      street: null,
      city: 'Mooreingham',
      county: null,
      postalCode: 'UY42 9SO',
      country: 'Wales',
      uprn: '903411609185',
      dependentLocality: null,
      doubleDependentLocality: null,
      typeId: null
    },
    correspondenceAddress: null,
    isCorrespondenceAsBusinessAddress: false,
    email: {
      address: 'Tremaine44@yahoo.com',
      validated: true
    },
    correspondenceEmail: {
      address: 'Viviane81@gmail.com',
      validated: true
    },
    phone: {
      mobile: '0151 390 3321',
      landline: '055 6443 2495'
    },
    correspondencePhone: {
      mobile: '0110 265 9147',
      landline: '0500 403408'
    },
    legalStatus: {
      code: 768039,
      type: 'Sole Proprietorship'
    },
    type: {
      code: 567982,
      type: 'Not Specified'
    },
    registrationNumbers: {
      companiesHouse: 'L7ONQluF',
      charityCommission: 'MhLGirFN'
    },
    additionalSbis: [],
    lastUpdated: '2024-12-31T17:38:09.734Z',
    isFinancialToBusinessAddress: true,
    hasLandInNorthernIreland: false,
    hasLandInScotland: true,
    hasLandInWales: false,
    hasAdditionalBusinessActivities: true,
    additionalBusinessActivities: [
      {
        code: 801680,
        type: 'Additional Business Activity 0'
      },
      {
        code: 874107,
        type: 'Additional Business Activity 1'
      },
      {
        code: 525111,
        type: 'Additional Business Activity 2'
      }
    ],
    isAccountablePeopleDeclarationCompleted: true,
    dateStartedFarming: '2024-08-20T08:22:59.257Z',
    landConfirmed: false,
    status: {
      locked: false,
      confirmed: true,
      deactivated: false
    }
  },
  customers: [
    {
      personId: '11111111',
      firstName: 'Gerhard',
      lastName: 'Purdy',
      crn: '1111111100',
      role: 'Business Partner'
    },
    {
      personId: '11111112',
      firstName: 'Odie',
      lastName: 'Lueilwitz',
      crn: '1111111200',
      role: 'Business Partner'
    },
    {
      personId: '11111113',
      firstName: 'Don',
      lastName: 'Stracke',
      crn: '1111111300',
      role: 'Business Partner'
    },
    {
      personId: '11111114',
      firstName: 'Tatum',
      lastName: 'McLaughlin',
      crn: '1111111400',
      role: 'Business Partner'
    },
    {
      personId: '11111115',
      firstName: 'Antwon',
      lastName: 'Mann',
      crn: '1111111500',
      role: 'Business Partner'
    },
    {
      personId: '11111116',
      firstName: 'Norris',
      lastName: 'Waters',
      crn: '1111111600',
      role: 'Business Partner'
    },
    {
      personId: '11111117',
      firstName: 'Marjorie',
      lastName: 'Simonis',
      crn: '1111111700',
      role: 'Business Partner'
    },
    {
      personId: '11111118',
      firstName: 'Cielo',
      lastName: 'Kohler',
      crn: '1111111800',
      role: 'Business Partner'
    },
    {
      personId: '11111119',
      firstName: 'Orlo',
      lastName: 'Kozey',
      crn: '1111111900',
      role: 'Business Partner'
    },
    {
      personId: '11111122',
      firstName: 'Richmond',
      lastName: 'Adams',
      crn: '1111112200',
      role: 'Business Partner'
    },
    {
      personId: '11111222',
      firstName: 'Oswaldo',
      lastName: 'Ortiz',
      crn: '1111122200',
      role: 'Business Partner'
    },
    {
      personId: '11112222',
      firstName: 'Anastasia',
      lastName: 'McCullough',
      crn: '1111222200',
      role: 'Business Partner'
    },
    {
      personId: '11122222',
      firstName: 'Forest',
      lastName: 'Murray',
      crn: '1112222200',
      role: 'Business Partner'
    },
    {
      personId: '11222222',
      firstName: 'Travis',
      lastName: 'Dooley',
      crn: '1122222200',
      role: 'Business Partner'
    },
    {
      personId: '12222222',
      firstName: 'Shad',
      lastName: 'Rau',
      crn: '1222222200',
      role: 'Business Partner'
    }
  ],
  customer: {
    personId: '11111111',
    firstName: 'Gerhard',
    lastName: 'Purdy',
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
      arableLandArea: 22.8294,
      permanentCropsArea: 0,
      permanentGrasslandArea: 51.1508,
      totalArea: 103.9607,
      totalParcels: 47
    },
    parcels: [
      {
        id: '7514996',
        sheetId: 'SS6828',
        parcelId: '3818',
        area: 0.8058,
        pendingDigitisation: false
      },
      {
        id: '6766326',
        sheetId: 'SS7027',
        parcelId: '0561',
        area: 5.5053,
        pendingDigitisation: false
      },
      {
        id: '6572426',
        sheetId: 'SS6728',
        parcelId: '2061',
        area: 0.0407,
        pendingDigitisation: false
      },
      {
        id: '7379882',
        sheetId: 'SS6629',
        parcelId: '3753',
        area: 1.2094,
        pendingDigitisation: false
      },
      {
        id: '7386080',
        sheetId: 'SS6829',
        parcelId: '4510',
        area: 7.5282,
        pendingDigitisation: false
      },
      {
        id: '6766315',
        sheetId: 'SS6928',
        parcelId: '2105',
        area: 6.6682,
        pendingDigitisation: false
      },
      {
        id: '6766354',
        sheetId: 'SS6928',
        parcelId: '3826',
        area: 6.5854,
        pendingDigitisation: false
      },
      {
        id: '6773871',
        sheetId: 'SS6829',
        parcelId: '5248',
        area: 0.7974,
        pendingDigitisation: false
      },
      {
        id: '7477825',
        sheetId: 'SS6529',
        parcelId: '9767',
        area: 2.5198,
        pendingDigitisation: false
      },
      {
        id: '6767667',
        sheetId: 'SS6630',
        parcelId: '3616',
        area: 5.066,
        pendingDigitisation: false
      },
      {
        id: '7701145',
        sheetId: 'SS6528',
        parcelId: '6585',
        area: 4.5051,
        pendingDigitisation: false
      },
      {
        id: '7540383',
        sheetId: 'SS6629',
        parcelId: '4510',
        area: 0.3344,
        pendingDigitisation: false
      },
      {
        id: '6770615',
        sheetId: 'SS6728',
        parcelId: '6480',
        area: 2.2063,
        pendingDigitisation: false
      },
      {
        id: '7700952',
        sheetId: 'SS6830',
        parcelId: '2554',
        area: 2.2911,
        pendingDigitisation: false
      },
      {
        id: '6770634',
        sheetId: 'SS6728',
        parcelId: '8425',
        area: 4.9526,
        pendingDigitisation: false
      },
      {
        id: '7700986',
        sheetId: 'SS6728',
        parcelId: '4989',
        area: 0.5395,
        pendingDigitisation: false
      },
      {
        id: '6490796',
        sheetId: 'SS6629',
        parcelId: '7730',
        area: 0.6309,
        pendingDigitisation: false
      },
      {
        id: '4106533',
        sheetId: 'SS6830',
        parcelId: '6845',
        area: 0.2139,
        pendingDigitisation: false
      },
      {
        id: '7701111',
        sheetId: 'SS6628',
        parcelId: '0352',
        area: 0.2124,
        pendingDigitisation: false
      },
      {
        id: '6766652',
        sheetId: 'SS6529',
        parcelId: '1654',
        area: 0.2077,
        pendingDigitisation: false
      },
      {
        id: '7477824',
        sheetId: 'SS6529',
        parcelId: '9756',
        area: 2.968,
        pendingDigitisation: false
      },
      {
        id: '6773631',
        sheetId: 'SS6827',
        parcelId: '2482',
        area: 1.0287,
        pendingDigitisation: false
      },
      {
        id: '7386007',
        sheetId: 'SS6828',
        parcelId: '1733',
        area: 0.7738,
        pendingDigitisation: false
      },
      {
        id: '7700960',
        sheetId: 'SS6728',
        parcelId: '3950',
        area: 0.8069,
        pendingDigitisation: false
      },
      {
        id: '7701120',
        sheetId: 'SS6628',
        parcelId: '6705',
        area: 0.6459,
        pendingDigitisation: false
      },
      {
        id: '6770629',
        sheetId: 'SS6828',
        parcelId: '2566',
        area: 1.4368,
        pendingDigitisation: false
      },
      {
        id: '6695491',
        sheetId: 'SS6630',
        parcelId: '9113',
        area: 4.5656,
        pendingDigitisation: false
      },
      {
        id: '5087080',
        sheetId: 'SS6828',
        parcelId: '6021',
        area: 0.091,
        pendingDigitisation: false
      },
      {
        id: '7386521',
        sheetId: 'SS6530',
        parcelId: '2110',
        area: 0.776,
        pendingDigitisation: false
      },
      {
        id: '5203389',
        sheetId: 'SS6628',
        parcelId: '1620',
        area: 0.3325,
        pendingDigitisation: false
      },
      {
        id: '5180013',
        sheetId: 'SS6828',
        parcelId: '7342',
        area: 0.2196,
        pendingDigitisation: false
      },
      {
        id: '5689762',
        sheetId: 'SS6528',
        parcelId: '7736',
        area: 0.7448,
        pendingDigitisation: false
      },
      {
        id: '7727586',
        sheetId: 'SS6629',
        parcelId: '5536',
        area: 2.8284,
        pendingDigitisation: false
      },
      {
        id: '6768147',
        sheetId: 'SS6629',
        parcelId: '6787',
        area: 0.2575,
        pendingDigitisation: false
      },
      {
        id: '5441609',
        sheetId: 'SS6828',
        parcelId: '1695',
        area: 1.5372,
        pendingDigitisation: false
      },
      {
        id: '6766307',
        sheetId: 'SS6928',
        parcelId: '7942',
        area: 5.4773,
        pendingDigitisation: false
      },
      {
        id: '7700977',
        sheetId: 'SS6829',
        parcelId: '0385',
        area: 4.9208,
        pendingDigitisation: false
      },
      {
        id: '7701110',
        sheetId: 'SS6628',
        parcelId: '0556',
        area: 1.1216,
        pendingDigitisation: false
      },
      {
        id: '6766259',
        sheetId: 'SS6627',
        parcelId: '9997',
        area: 1.4513,
        pendingDigitisation: false
      },
      {
        id: '7700957',
        sheetId: 'SS6728',
        parcelId: '5527',
        area: 12.2432,
        pendingDigitisation: false
      },
      {
        id: '7701127',
        sheetId: 'SS6628',
        parcelId: '4434',
        area: 2.9197,
        pendingDigitisation: false
      },
      {
        id: '6770596',
        sheetId: 'SS6727',
        parcelId: '3735',
        area: 0.4109,
        pendingDigitisation: false
      },
      {
        id: '6739055',
        sheetId: 'SS6828',
        parcelId: '2933',
        area: 0.9523,
        pendingDigitisation: false
      },
      {
        id: '5523156',
        sheetId: 'SS6928',
        parcelId: '5419',
        area: 0.1964,
        pendingDigitisation: false
      },
      {
        id: '7540369',
        sheetId: 'SS6728',
        parcelId: '3427',
        area: 0.041,
        pendingDigitisation: false
      },
      {
        id: '7540367',
        sheetId: 'SS6728',
        parcelId: '4558',
        area: 0.4288,
        pendingDigitisation: false
      },
      {
        id: '5930807',
        sheetId: 'SS6827',
        parcelId: '7399',
        area: 1.9644,
        pendingDigitisation: false
      }
    ],
    parcel: {
      id: '7514996',
      sheetId: 'SS6828',
      parcelId: '3818',
      area: 0.8058,
      pendingDigitisation: false,
      effectiveToDate: '2024-08-20T05:42:41.649Z',
      effectiveFromDate: '2024-08-19T05:42:41.649Z'
    },
    parcelCovers: [
      {
        id: '12151270',
        name: 'Structure',
        area: 0.1811,
        code: '525',
        isBpsEligible: false
      },
      {
        id: '12151271',
        name: 'Farmyards',
        area: 0.2927,
        code: '379',
        isBpsEligible: false
      },
      {
        id: '12151272',
        name: 'Woodland',
        area: 0.2354,
        code: '332',
        isBpsEligible: false
      },
      {
        id: '12151268',
        name: 'Metalled track',
        area: 0.0634,
        code: '631',
        isBpsEligible: false
      },
      {
        id: '12151269',
        name: 'Farmyards',
        area: 0.0332,
        code: '379',
        isBpsEligible: false
      }
    ]
  },
  agreements: [],
  applications: [
    {
      sbi: '1111111111',
      id: '4957577517',
      subjectId: '9888153412',
      year: 2022,
      name: 'ULTERIUS TURPIS TERGA CORRUMPO DEDECOR AUDACIA APPOSITUS DEPRECATOR',
      moduleCode: 'ABUTOR_ADFICIO_CULPA_2022',
      scheme: 'CONDUCO PROVIDENT VARIUS ODIO',
      statusCodeP: 'STADOM',
      statusCodeS: '000090',
      status: 'PAID',
      submissionDate: null,
      portalStatusP: 'DOMPRS',
      portalStatusS: 'PAYPRO',
      portalStatus: 'Paid',
      active: true,
      transitionId: '9765470390',
      transitionName: 'TO PAID',
      agreementReferences: ['9346492622'],
      transitionHistory: [
        {
          id: '9765470390',
          name: 'TO PAID',
          timestamp: '2022-12-31T09:48:46.540Z',
          checkStatus: 'PASSED'
        }
      ]
    }
  ],
  countyParishHoldings: [
    {
      address: 'ODIO DEPRECATOR TEXTUS FARM, HYMAN PARADE, MOOREINGHAM, UY42 9SO',
      cphNumber: '95/788/7341',
      endDate: '9999-12-31',
      parish: 'Farlam',
      species: 'GOAT(S),CAMELIDS,PIGEONS,POULTRY,DEER,OTHER,CATTLE',
      startDate: '2020-09-17',
      xCoordinate: 618853,
      yCoordinate: 10837
    }
  ]
}

const agreement = [
  {
    contractId: '1111111111',
    name: 'CS AGREEMENT',
    status: 'SIGNED',
    contractType: 'Higher Level Stewardship',
    schemeYear: 2025,
    startDate: '2020-06-10T00:00:00.000Z',
    endDate: '2029-09-19T00:00:00.000Z'
  },
  {
    contractId: '1111111112',
    name: 'HLS AGREEMENT',
    status: 'EXPIRED',
    contractType: 'Higher Level Stewardship',
    schemeYear: 2025,
    startDate: '2017-11-16T00:00:00.000Z',
    endDate: '2028-09-06T00:00:00.000Z'
  },
  {
    contractId: '1111111113',
    name: 'HLS AGREEMENT',
    status: 'EXPIRED',
    contractType: 'Entry Level Stewardship',
    schemeYear: 2025,
    startDate: '2019-08-06T00:00:00.000Z',
    endDate: '2029-11-02T00:00:00.000Z'
  }
]

const paymentSchedules = [
  {
    optionCode: 'CYZ',
    optionDescription: 'Tabesco ulterius turpis terga corrumpo dedecor.',
    commitmentGroupStartDate: '2016-11-08T00:00:00.000Z',
    commitmentGroupEndDate: '2025-09-04T00:00:00.000Z',
    year: 2024,
    sheetName: 'PLABUR',
    parcelName: '4368',
    actionArea: 2.9824,
    actionMTL: null,
    actionUnits: 14,
    parcelTotalArea: 2.2449,
    startDate: '2022-03-24T00:00:00.000Z',
    endDate: '2028-05-15T00:00:00.000Z'
  },
  {
    optionCode: 'FTF',
    optionDescription: 'Victus cunabula campana voluptate suasoria nam vinco.',
    commitmentGroupStartDate: '2024-06-08T00:00:00.000Z',
    commitmentGroupEndDate: '2025-01-09T00:00:00.000Z',
    year: 2024,
    sheetName: 'VFFGBZ',
    parcelName: '1855',
    actionArea: 4.9701,
    actionMTL: null,
    actionUnits: 94,
    parcelTotalArea: 2.2832,
    startDate: '2021-06-05T00:00:00.000Z',
    endDate: '2025-02-18T00:00:00.000Z'
  },
  {
    optionCode: 'XZJ',
    optionDescription: 'Spes decumbo delibero cohors canonicus.',
    commitmentGroupStartDate: '2019-06-06T00:00:00.000Z',
    commitmentGroupEndDate: '2029-12-05T00:00:00.000Z',
    year: 2025,
    sheetName: 'JAUWEQ',
    parcelName: '3212',
    actionArea: 4.8428,
    actionMTL: 28,
    actionUnits: 82,
    parcelTotalArea: 4.5663,
    startDate: '2016-08-31T00:00:00.000Z',
    endDate: '2029-05-27T00:00:00.000Z'
  },
  {
    optionCode: 'IXP',
    optionDescription: 'Video adipisci communis xiphias cursim minus.',
    commitmentGroupStartDate: '2017-06-13T00:00:00.000Z',
    commitmentGroupEndDate: '2029-11-08T00:00:00.000Z',
    year: 2024,
    sheetName: 'BAOYHK',
    parcelName: '7726',
    actionArea: 1.0364,
    actionMTL: 76,
    actionUnits: 79,
    parcelTotalArea: 3.8271,
    startDate: '2016-02-27T00:00:00.000Z',
    endDate: '2029-01-21T00:00:00.000Z'
  },
  {
    optionCode: 'PRS',
    optionDescription: 'Speciosus teres teres cervus tenus.',
    commitmentGroupStartDate: '2021-12-08T00:00:00.000Z',
    commitmentGroupEndDate: '2026-07-04T00:00:00.000Z',
    year: 2024,
    sheetName: 'IPXWZZ',
    parcelName: '0977',
    actionArea: 4.4436,
    actionMTL: null,
    actionUnits: 95,
    parcelTotalArea: 2.9343,
    startDate: '2016-10-10T00:00:00.000Z',
    endDate: '2028-12-30T00:00:00.000Z'
  },
  {
    optionCode: 'ZIY',
    optionDescription: 'Pauper suppellex corpus valeo.',
    commitmentGroupStartDate: '2020-01-13T00:00:00.000Z',
    commitmentGroupEndDate: '2027-05-31T00:00:00.000Z',
    year: 2024,
    sheetName: 'UAPQGR',
    parcelName: '0806',
    actionArea: 2.5914,
    actionMTL: null,
    actionUnits: null,
    parcelTotalArea: 2.6476,
    startDate: '2019-03-20T00:00:00.000Z',
    endDate: '2027-08-09T00:00:00.000Z'
  },
  {
    optionCode: 'ODI',
    optionDescription: 'Denego ara ambulo iusto tam contigo.',
    commitmentGroupStartDate: '2020-12-24T00:00:00.000Z',
    commitmentGroupEndDate: '2028-12-08T00:00:00.000Z',
    year: 2025,
    sheetName: 'MGSOJU',
    parcelName: '1969',
    actionArea: 3.5819,
    actionMTL: null,
    actionUnits: null,
    parcelTotalArea: 1.3682,
    startDate: '2021-11-15T00:00:00.000Z',
    endDate: '2028-01-31T00:00:00.000Z'
  },
  {
    optionCode: 'QXE',
    optionDescription: 'Thymbra denego arcus.',
    commitmentGroupStartDate: '2015-02-09T00:00:00.000Z',
    commitmentGroupEndDate: '2028-05-22T00:00:00.000Z',
    year: 2025,
    sheetName: 'YRDOIV',
    parcelName: '2342',
    actionArea: 4.9081,
    actionMTL: null,
    actionUnits: null,
    parcelTotalArea: 3.6608,
    startDate: '2023-03-25T00:00:00.000Z',
    endDate: '2025-04-25T00:00:00.000Z'
  },
  {
    optionCode: 'EZV',
    optionDescription: 'Tibi demo cedo suspendo aeternus.',
    commitmentGroupStartDate: '2024-03-06T00:00:00.000Z',
    commitmentGroupEndDate: '2029-07-24T00:00:00.000Z',
    year: 2024,
    sheetName: 'RZTGOE',
    parcelName: '8594',
    actionArea: 4.4455,
    actionMTL: 81,
    actionUnits: null,
    parcelTotalArea: 4.4645,
    startDate: '2024-03-03T00:00:00.000Z',
    endDate: '2025-12-29T00:00:00.000Z'
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
    dateOfBirth: '1955-04-23',
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
      name: 'Lowe - Wolf',
      organisationId: '1111111111',
      sbi: '1111111111'
    }
  ],
  business: {
    organisationId: '1111111111',
    sbi: '1111111111',
    name: 'Lowe - Wolf',
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
        sbi: '1111111111',
        crn: '1111111100',
        date: '2025-05-04',
        sheetId: 'SS6828',
        parcelId: '3818'
      },
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject({
      ...business,
      agreements: expect.arrayContaining(
        agreement.map((agr) => ({
          ...agr,
          paymentSchedules: expect.arrayContaining(
            paymentSchedules.filter((ps) =>
              agr.contractId === '1111111111'
                ? ['CYZ', 'FTF', 'XZJ'].includes(ps.optionCode)
                : agr.contractId === '1111111112'
                  ? ['IXP', 'PRS', 'ZIY'].includes(ps.optionCode)
                  : ['ODI', 'QXE', 'EZV'].includes(ps.optionCode)
            )
          )
        }))
      )
    })
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
    const response = await client.request(
      businessQuery,
      {
        sbi: '1111111111',
        crn: '1111111100',
        date: '2025-05-04',
        sheetId: 'SS6828',
        parcelId: '3818'
      },
      { 'x-forwarded-authorization': tokenValue, 'gateway-type': 'external' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business).toMatchObject({
      ...business,
      agreements: expect.arrayContaining(
        agreement.map((agr) => ({
          ...agr,
          paymentSchedules: expect.arrayContaining(
            paymentSchedules.filter((ps) =>
              agr.contractId === '1111111111'
                ? ['CYZ', 'FTF', 'XZJ'].includes(ps.optionCode)
                : agr.contractId === '1111111112'
                  ? ['IXP', 'PRS', 'ZIY'].includes(ps.optionCode)
                  : ['ODI', 'QXE', 'EZV'].includes(ps.optionCode)
            )
          )
        }))
      )
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
