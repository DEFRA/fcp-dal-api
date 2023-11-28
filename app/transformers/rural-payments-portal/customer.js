export const ruralPaymentsPortalCustomerTransformer = (data) => {
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
