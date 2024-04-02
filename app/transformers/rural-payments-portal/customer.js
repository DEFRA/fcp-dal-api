import { GraphQLError } from 'graphql/index.js'

export const ruralPaymentsPortalCustomerTransformer = data => {
  return {
    info: {
      name: {
        title: data.title,
        otherTitle: data.otherTitle,
        first: data.firstName,
        middle: data.middleName,
        last: data.lastName
      },
      dateOfBirth: data.dateOfBirth,
      phone: {
        mobile: data.mobile,
        landline: data.landline,
        fax: data.fax
      },
      email: {
        address: data.email,
        validated: data.emailValidated,
        doNotContact: data.doNotContact
      },
      address: {
        pafOrganisationName: data.address.pafOrganisationName,
        buildingNumberRange: data.address.buildingNumberRange,
        buildingName: data.address.buildingName,
        flatName: data.address.flatName,
        street: data.address.street,
        city: data.address.city,
        county: data.address.county,
        postalCode: data.address.postalCode,
        country: data.address.country,
        uprn: data.address.uprn,
        dependentLocality: data.address.dependentLocality,
        doubleDependentLocality: data.address.doubleDependentLocality,
        typeId: data.address.addressTypeId
      },
      status: {
        locked: data.locked,
        confirmed: data.confirmed,
        deactivated: data.deactivated
      }
    },
    id: data.id
  }
}

export function transformPersonRolesToCustomerAuthorisedBusinessesRoles (customerId, personRoles) {
  return personRoles.filter(({ personId }) => personId.toString() === customerId).map(({ role }) => role)
}

export function transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges (customerId, personPrivileges) {
  return personPrivileges.filter(({ personId }) => personId.toString() === customerId).map(({ privilegeNames }) => privilegeNames[0])
}

export function transformPersonSummaryToCustomerAuthorisedBusinesses (customerId, summary) {
  return summary.map(({ id, name, sbi }) => ({
    customerId,
    id,
    name,
    sbi
  }))
}

export function transformNotificationsToMessages (notifications = [], showOnlyDeleted = false) {
  return notifications
    .map((message) => ({
      id: message.id,
      title: message.title,
      date: message.createdAt,
      body: message.body,
      read: !!message.readAt,
      archivedAt: message.archivedAt
    }))
    .filter(({ archivedAt }) => showOnlyDeleted ? archivedAt !== null : archivedAt === null)
}

export function transformPersonSummaryToCustomerAuthorisedFilteredBusiness (sbi, summary) {
  const filteredBusinessForCustomer = summary.filter(person => person.sbi === sbi)
  if (filteredBusinessForCustomer.length === 0) {
    throw new GraphQLError(
      'Customer does not have an access to view business information',
      {
        extensions: {
          code: 'FORBIDDEN'
        }
      }
    )
  }

  return {
    id: filteredBusinessForCustomer[0].id,
    name: filteredBusinessForCustomer[0].name
  }
}
