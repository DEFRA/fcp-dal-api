export const transformOrganisationCustomers = data => {
  return data.map(transformOrganisationCustomer)
}

export const transformOrganisationCustomer = ({ id, firstName, lastName, customerReference, role, privileges }) => ({
  personId: id,
  firstName,
  lastName,
  crn: customerReference,
  role,
  privileges
})

export function transformBusinessCustomerPrivilegesToPermissionGroups (
  privileges,
  permissionGroups
) {
  const customerPermissionGroups = []

  for (const permissionGroup of permissionGroups) {
    for (const permission of permissionGroup.permissions) {
      if (
        permission.privilegeNames.some(privilegeName =>
          privileges.includes(privilegeName)
        )
      ) {
        customerPermissionGroups.push({
          id: permissionGroup.id,
          level: permission.level
        })
      }
    }
  }

  return customerPermissionGroups
}

export const transformOrganisationToBusiness = data => {
  return {
    info: {
      name: data.name,
      reference: data.businessReference,
      vat: data.taxRegistrationNumber,
      traderNumber: data.traderNumber,
      vendorNumber: data.vendorNumber,
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
      phone: {
        mobile: data.mobile,
        landline: data.landline,
        fax: data.fax
      },
      email: {
        address: data.email,
        validated: data.emailValidated,
        doNotContact: data.doNotContact || false
      },
      legalStatus: {
        code: data.legalStatus?.id,
        type: data.legalStatus?.type
      },
      type: {
        code: data.businessType?.id,
        type: data.businessType?.type
      },
      registrationNumbers: {
        companiesHouse: data.companiesHouseRegistrationNumber,
        charityCommission: data.charityCommissionRegistrationNumber
      }
    },
    organisationId: `${data.id}`,
    sbi: `${data.sbi}`
  }
}
