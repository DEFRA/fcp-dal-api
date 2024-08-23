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
    const { schema } = await import(
      `../../../app/graphql/server.js?test=${Math.random()}`
    )
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    expect(
      result.data.__schema.directives.find(({ name }) => name === 'on')
    ).toBe(undefined)
  })

  it('should only contain fields that have the @on directive', async () => {
    delete process.env.ALL_SCHEMA_ON
    const { schema } = await import(
      `../../../app/graphql/server.js?test=${Math.random()}`
    )

    expect(
      findBreakingChanges(
        schema,
        buildSchema(`#graphql
      scalar Int
      scalar Float
      scalar Date

      type Query {
        business(sbi: ID!): Business
        customer(crn: ID!): Customer
      }

      """Represents the a customer of a business."""
      type BusinessCustomer {
        """The unique identifier of the customer."""
        personId: ID

        """First name of the customer."""
        firstName: String

        """Last name of the customer."""
        lastName: String

        """The customer reference of the customer."""
        crn: String

        """The role the customer against the business."""
        role: String

        """The permissions the customer against the business."""
        permissionGroups: [BusinessCustomerPermissionGroup]
      }

      type BusinessCustomerPermissionGroup {
        """The permission group id."""
        id: PermissionGroupId!

        """The permission level customer has for the business."""
        level: PermissionLevel
      }

      """
      Represents a business.

      Data Source: Rural Payments Portal (PRR)
      """
      type Business {
        """The first unique identifier of the business."""
        organisationId: ID

        """The Single Business Identifier (SBI) of the business."""
        sbi: ID!

        """The customers associated with the business."""
        customers: [BusinessCustomer]
      }

      """Represents the security questions of a customer."""
      type CustomerAuthenticationQuestions {
        """The memorable date question."""
        memorableDate: String

        """The memorable event question."""
        memorableEvent: String

        """The memorable place question."""
        memorablePlace: String

        """The date the record was last updated."""
        updatedAt: Date

        """The indicator for customer record been found in authenticate database"""
        isFound: Boolean
      }

      """Represents a customer."""
      type Customer {
        """The unique identifier of the customer."""
        personId: ID!

        """The CRN (Customer Reference Number) of the customer."""
        crn: ID!

        """The security questions of the customer."""
        authenticationQuestions: CustomerAuthenticationQuestions

        """The businesses associated with the customer."""
        businesses: [CustomerBusiness]
      }

      """Represents a business owned by a customer."""
      type CustomerBusiness {
        """The unique identifier of the business."""
        organisationId: ID

        """The SBI (Single Business Identifier) of the business."""
        sbi: ID!

        """The name of the business."""
        name: String!

        """The role associated with the business."""
        role: String

        """The permission groups associated with the business."""
        permissionGroups: [CustomerBusinessPermissionGroup]
      }

      type CustomerBusinessPermissionGroup {
        """The permission group id."""
        id: PermissionGroupId!

        """The permission level customer has for the business."""
        level: PermissionLevel
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

      enum AuthRole {
        ADMIN
      }

      directive @auth(requires: AuthRole = ADMIN) on OBJECT | FIELD_DEFINITION
   `)
      )
    ).toHaveLength(0)
  })

  it('should contain all fields if process.env.ALL_SCHEMA is set', async () => {
    const { schema } = await import(
      `../../../app/graphql/server.js?test=${Math.random()}`
    )
    expect(
      findBreakingChanges(
        schema,
        buildSchema(`#graphql
      type Query {
        business(sbi: ID!): Business
        permissionGroups: [PermissionGroup]
        customer(crn: ID!): Customer
      }

      """Represents data about a customers or business phone/fax details"""
      type Phone {
        """Mobile number of the customer or business"""
        mobile: String

        """Landline number of the customer or business"""
        landline: String

        """Fax number of the customer or business"""
        fax: String
      }

      """Represents data about a customers or business email details"""
      type Email {
        """Email address of the customer or business"""
        address: String

        """Validated status of the email address"""
        validated: Boolean

        """Do not contact status of the email address"""
        doNotContact: Boolean
      }

      """Represents data about a customers or business address details"""
      type Address {
        """PAF organisation name"""
        pafOrganisationName: String

        """Building number range of the address"""
        buildingNumberRange: String

        """Building name of the address"""
        buildingName: String

        """Flat name of the address"""
        flatName: String

        """Street of the address"""
        street: String

        """Locality of the address"""
        city: String

        """County of the address"""
        county: String

        """Postal code of the address"""
        postalCode: String

        """Country of the address"""
        country: String

        """UPRN of the address"""
        uprn: String

        """Dependant locality of the address"""
        dependentLocality: String

        """Double dependant locality of the address"""
        doubleDependentLocality: String

        """Type ID of the address"""
        typeId: String
      }

      """Represents data about a pagination details for a list of items"""
      input Pagination {
        """Number of items per page"""
        perPage: Int!

        """Page number"""
        page: Int!
      }

      scalar Date

      """Represents the status of a business application."""
      type BusinessApplicationStatus {
        """The unique identifier of the business application status."""
        id: ID

        """The open status of the business application."""
        open: String

        """The status of the business application."""
        status: String

        """The type of the business application."""
        type: String

        """The sector of the business application."""
        sector: String

        """The year of the business application."""
        year: Int

        """The FRN (Farm Reference Number) of the business application."""
        frn: String

        """The office of the business application."""
        office: String
      }

      """Represents a claim of a business application."""
      type BusinessApplicationClaim {
        """The schema year of the business application claim."""
        schemaYear: Int

        """The type of the business application claim."""
        type: String

        """The status of the business application claim."""
        status: String

        """The last movement of the business application claim."""
        lastMovement: String
      }

      """
      Represents a business application.

      Data Source: Rural Payments Portal (PRR)
      """
      type BusinessApplication {
        """The status of the business application."""
        applicationStatus: BusinessApplicationStatus

        """The claim of the business application."""
        csClaim: BusinessApplicationClaim
      }

      """Represents the basic information of a business."""
      type BusinessInfo {
        """The name of the business."""
        name: String

        """The reference of the business."""
        reference: String

        """The VAT number of the business."""
        vat: String

        """The trader number of the business."""
        traderNumber: String

        """The vendor number of the business."""
        vendorNumber: String

        """The address of the business."""
        address: Address

        """The phone details of the business."""
        phone: Phone

        """The email details of the business."""
        email: Email

        """The legal status of the business."""
        legalStatus: BusinessType

        """The type of the business."""
        type: BusinessType

        """The registration numbers of the business."""
        registrationNumbers: BusinessRegistrationNumbers
      }

      """Represents the registration numbers of a business."""
      type BusinessRegistrationNumbers {
        """The Companies House number of the business."""
        companiesHouse: String

        """The Charity Commission number of the business."""
        charityCommission: String
      }

      """Represents the type of a business."""
      type BusinessType {
        """The code of the business type."""
        code: Int

        """The type of the business."""
        type: String
      }

      """Represents the a customer of a business."""
      type BusinessCustomer {
        """The unique identifier of the customer."""
        personId: ID

        """First name of the customer."""
        firstName: String

        """Last name of the customer."""
        lastName: String

        """The customer reference of the customer."""
        crn: String

        """The role the customer against the business."""
        role: String

        """The permissions the customer against the business."""
        permissionGroups: [BusinessCustomerPermissionGroup]
      }

      type BusinessCustomerPermissionGroup {
        """The permission group id."""
        id: PermissionGroupId!

        """The permission level customer has for the business."""
        level: PermissionLevel
      }

      """
      Represents a business.

      Data Source: Rural Payments Portal (PRR)
      """
      type Business {
        """The first unique identifier of the business."""
        organisationId: ID

        """The Single Business Identifier (SBI) of the business."""
        sbi: ID!

        """The basic information of the business."""
        info: BusinessInfo

        """The land details of the business."""
        land: BusinessLand

        """The applications associated with the business."""
        applications: [BusinessApplication]

        """The CPH (County Parish Holding) numbers of the business."""
        cph: [CPH]

        """The customers associated with the business."""
        customers: [BusinessCustomer]
      }

      """Represents a coordinate with x and y values."""
      type CPHCoordinate {
        """The x value of the coordinate."""
        x: Int

        """The y value of the coordinate."""
        y: Int
      }

      """
      Represents a County Parish Holding (CPH) number.

      Data Source: Rural Payments Portal (PRR)
      """
      type CPH {
        """The CPH number."""
        number: String

        """The parcel numbers associated with the CPH number."""
        parcelNumbers: [String]

        """The parish associated with the CPH number."""
        parish: String

        """The start date of the CPH number."""
        startDate: Int

        """The expiry date of the CPH number."""
        expiryDate: Int

        """The species associated with the CPH number."""
        species: [String]

        """The coordinate of the CPH number."""
        coordinate: CPHCoordinate
      }

      """Represents the name of a business land cover."""
      enum BusinessLandCoverName {
        """Represents permanent grassland."""
        PERMANENT_GRASSLAND

        """Represents permanent crops."""
        PERMANENT_CROPS

        """Represents arable land."""
        ARABLE_LAND
      }

      """Represents a parcel of a business land."""
      type BusinessLandParcel {
        """The unique identifier of the land parcel."""
        id: ID!

        """The sheet ID of the land parcel."""
        sheetId: String

        """The area of the land parcel."""
        area: Float
      }

      """Represents a summary of a business land."""
      type BusinessLandSummary {
        """The area of arable land."""
        arableLandArea: Float

        """The area of permanent crops."""
        permanentCropsArea: Float

        """The area of permanent grassland."""
        permanentGrasslandArea: Float

        """The total area of the business land."""
        totalArea: Float

        """The total number of parcels in the business land."""
        totalParcels: Float
      }

      """Represents a cover of a business land."""
      type BusinessLandCover {
        """The unique identifier of the land cover."""
        id: ID!

        """The name of the land cover."""
        name: BusinessLandCoverName

        """The area of the land cover."""
        area: Float
      }

      """
      Represents a business land.

      Data Source: Rural Payments Portal (PRR)
      """
      type BusinessLand {
        """The covers of the business land."""
        covers: [BusinessLandCover]

        """The parcels of the business land."""
        parcels: [BusinessLandParcel]

        """The summary of the business land."""
        summary(historicDate: Date): BusinessLandSummary
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
        """The permission group id."""
        id: PermissionGroupId!

        """The permission group name."""
        name: String!

        """The permissions within the group."""
        permissions: [Permission]
      }

      type Permission {
        """The permission level."""
        level: PermissionLevel

        """The functions that can be performed with given permission level."""
        functions: [String]

        """Check if this level is active for given customer and business."""
        active(crn: ID!, sbi: ID!): Boolean
      }

      """
      Represents the basic information of a customer.

      Data Source: Rural Payments Portal (PRR)
      """
      type CustomerInfo {
        """The name of the customer."""
        name: CustomerName

        """The date of birth of the customer."""
        dateOfBirth: String

        """The phone details of the customer."""
        phone: Phone

        """The email details of the customer."""
        email: Email

        """The status details of the customer."""
        status: CustomerStatus

        """The address details of the customer."""
        address: Address
      }

      """Represents the full name of a customer."""
      type CustomerName {
        """The title of the customer (e.g., Mr., Mrs., Dr.)."""
        title: String

        """Any other title of the customer."""
        otherTitle: String

        """The first name of the customer."""
        first: String

        """The middle name of the customer."""
        middle: String

        """The last name of the customer."""
        last: String
      }

      """Represents the status of a customer."""
      type CustomerStatus {
        """Whether the customer account is locked."""
        locked: Boolean

        """Whether the customer account is confirmed."""
        confirmed: Boolean

        """Whether the customer account is deactivated."""
        deactivated: Boolean
      }

      """Represents the security questions of a customer."""
      type CustomerAuthenticationQuestions {
        """The memorable date question."""
        memorableDate: String

        """The memorable event question."""
        memorableEvent: String

        """The memorable place question."""
        memorablePlace: String

        """The date the record was last updated."""
        updatedAt: Date

        """The indicator for customer record been found in authenticate database"""
        isFound: Boolean
      }

      """Represents a customer."""
      type Customer {
        """The unique identifier of the customer."""
        personId: ID!

        """The CRN (Customer Reference Number) of the customer."""
        crn: ID!

        """The basic information of the customer."""
        info: CustomerInfo

        """The security questions of the customer."""
        authenticationQuestions: CustomerAuthenticationQuestions

        """The businesses associated with the customer."""
        businesses: [CustomerBusiness]

        """The single business filtered by sbi associated with the customer."""
        business(sbi: ID!): CustomerBusiness
      }

      """Represents a business owned by a customer."""
      type CustomerBusiness {
        """The unique identifier of the business."""
        organisationId: ID

        """The SBI (Single Business Identifier) of the business."""
        sbi: ID!

        """The name of the business."""
        name: String!

        """The role associated with the business."""
        role: String

        """The messages associated with the business."""
        messages(pagination: Pagination, showOnlyDeleted: Boolean): [CustomerBusinessMessage]

        """The permission groups associated with the business."""
        permissionGroups: [CustomerBusinessPermissionGroup]
      }

      type CustomerBusinessPermissionGroup {
        """The permission group id."""
        id: PermissionGroupId!

        """The permission level customer has for the business."""
        level: PermissionLevel
      }

      """
      Represents a message related to a customer's business.

      Data Source: Rural Payments Portal (PRR)
      """
      type CustomerBusinessMessage {
        """The unique identifier of the message."""
        id: ID!

        """The title of the message."""
        title: String

        """The date of the message."""
        date: Date

        """The body content of the message."""
        body: String

        """Whether the message has been read."""
        read: Boolean
      }

      enum AuthRole {
        ADMIN
      }

      directive @auth(requires: AuthRole = ADMIN) on OBJECT | FIELD_DEFINITION
    `)
      )
    ).toHaveLength(0)
  })
})
