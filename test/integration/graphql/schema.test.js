import {
  graphql,
  getIntrospectionQuery,
  buildSchema,
  findBreakingChanges
} from 'graphql'

describe('schema', () => {
  beforeEach(() => {
    process.env.ALL_SCHEMA_ON = true
  })

  it('should not include custom @on directive in final schema output', async () => {
    const { schema } = await import(`../../../app/graphql/server.js?test=${Math.random()}`)
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    expect(result.data.__schema.directives.find(({ name }) => name === 'on')).toBe(undefined)
  })

  it('should only contain fields that have the @on directive', async () => {
    delete process.env.ALL_SCHEMA_ON
    const { schema } = await import(`../../../app/graphql/server.js?test=${Math.random()}`)

    expect(findBreakingChanges(schema, buildSchema(`#graphql
      scalar Int
      scalar Float
      scalar Date

      type Query {
        customer(crn: ID!): Customer
      }

      type CustomerAuthenticationQuestions {
        memorableDate: String
        memorableEvent: String
        memorablePlace: String
        updatedAt: Date
        isFound: Boolean
      }

      type Customer {
        crn: ID!
        authenticationQuestions: CustomerAuthenticationQuestions
      }
   `))).toHaveLength(0)
  })

  it('should contain all fields if process.env.ALL_SCHEMA is set', async () => {
    const { schema } = await import(`../../../app/graphql/server.js?test=${Math.random()}`)
    expect(findBreakingChanges(schema, buildSchema(`#graphql
      type Query {
        business(sbi: ID!): Business
        businessApplications(sbi: ID!): [BusinessApplication]
        customer(crn: ID!): Customer
        permissionGroups: [PermissionGroup]
      }
      
      type Phone {
        mobile: String
        landline: String
        fax: String
      }
      
      type Email {
        address: String
        validated: Boolean
        doNotContact: Boolean
      }
      
      type Address {
        pafOrganisationName: String
        buildingNumberRange: String
        buildingName: String
        flatName: String
        street: String
        city: String
        county: String
        postalCode: String
        country: String
        uprn: String
        dependentLocality: String
        doubleDependentLocality: String
        typeId: String
      }
      
      input Pagination {
        perPage: Int!
        page: Int!
      }
      
      scalar Date
      
      type BusinessApplicationStatus {
        id: ID
        open: String
        status: String
        type: String
        sector: String
        year: Int
        frn: String
        office: String
      }
      
      type BusinessApplicationClaim {
        schemaYear: Int
        type: String
        status: String
        lastMovement: String
      }
      
      type BusinessApplication {
        applicationStatus: BusinessApplicationStatus
        csClaim: BusinessApplicationClaim
      }
      
      type BusinessInfo {
        name: String
        reference: String
        vat: String
        traderNumber: String
        vendorNumber: String
        address: Address
        phone: Phone
        email: Email
        legalStatus: BusinessType
        type: BusinessType
        registrationNumbers: BusinessRegistrationNumbers
      }
      
      type BusinessRegistrationNumbers {
        companiesHouse: String
        charityCommission: String
      }
      
      type BusinessType {
        code: Int
        type: String
      }
      
      type BusinessCustomer {
        customerId: ID
        firstName: String
        lastName: String
        customerReference: String
        role: String
        permissions: [BusinessCustomerPermission]
      }
      
      type BusinessCustomerPermission {
        id: PermissionGroupId!
        name: String!
        level: PermissionLevel
      }
      
      type Business {
        businessId: ID
        sbi: ID!
        info: BusinessInfo
        land: BusinessLand
        applications: [BusinessApplication]
        cph: [CPH]
        customers: [BusinessCustomer]
      }
      
      type CPHCoordinate {
        x: Int
        y: Int
      }
      
      type CPH {
        number: String
        parcelNumbers: [String]
        parish: String
        startDate: Int
        expiryDate: Int
        species: [String]
        coordinate: CPHCoordinate
      }
      
      enum BusinessLandCoverName {
        PERMANENT_GRASSLAND
        PERMANENT_CROPS
        ARABLE_LAND
      }
      
      type BusinessLandParcel {
        id: ID!
        sheetId: String
        area: Float
      }
      
      type BusinessLandSummary {
        arableLandArea: Float
        permanentCropsArea: Float
        permanentGrasslandArea: Float
        totalArea: Float
        totalParcels: Float
      }
      
      type BusinessLandCover {
        id: ID!
        name: BusinessLandCoverName
        area: Float
      }
      
      type BusinessLand {
        covers: [BusinessLandCover]
        parcels: [BusinessLandParcel]
        summary: BusinessLandSummary
      }
      
      type CustomerInfo {
        name: CustomerName
        dateOfBirth: String
        phone: Phone
        email: Email
        status: CustomerStatus
        address: Address
      }
      
      type CustomerName {
        title: String
        otherTitle: String
        first: String
        middle: String
        last: String
      }
      
      type CustomerStatus {
        locked: Boolean
        confirmed: Boolean
        deactivated: Boolean
      }
      
      type CustomerAuthenticationQuestions {
        memorableDate: String
        memorableEvent: String
        memorablePlace: String
        updatedAt: Date
        isFound: Boolean
      }
      
      type Customer {
        customerId: ID!
        crn: ID!
        info: CustomerInfo
        authenticationQuestions: CustomerAuthenticationQuestions
        businesses: [CustomerBusiness]
        business(sbi: ID!): CustomerBusiness
      }
      
      type CustomerBusiness {
        businessId: ID
        sbi: ID!
        name: String!
        roles: [String]
        messages(pagination: Pagination, showOnlyDeleted: Boolean): [CustomerBusinessMessage]
        permissionGroups: [CustomerBusinessPermissionGroup]
      }
      
      type CustomerBusinessPermissionGroup {
        id: PermissionGroupId
        level: PermissionLevel
      }
      
      type CustomerBusinessMessage {
        id: ID!
        title: String
        date: Date
        body: String
        read: Boolean
      }
      
      enum PermissionLevel {
        NO_ACCESS
        VIEW
        AMEND
        SUBMIT
        MAKE_LEGAL_CHANGES
        FULL_PERMISSION
      }
      
      enum PermissionGroupId {
        BASIC_PAYMENT_SCHEME
        BUSINESS_DETAILS
        COUNTRYSIDE_STEWARDSHIP_AGREEMENTS
        COUNTRYSIDE_STEWARDSHIP_APPLICATIONS
        ENTITLEMENTS
        ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS
        LAND_DETAILS
      }
      
      type PermissionGroup {
        id: PermissionGroupId!
        name: String!
        permissions: [Permission]
      }
      
      type Permission {
        level: PermissionLevel
        functions: [String]
        active(customerId: String!, businessId: String!): Boolean
      }
    `))).toHaveLength(0)
  })
})
