export const transformOrganisationCustomers = (data) => {
  return data.map(transformOrganisationCustomer)
}

export const transformOrganisationCustomer = ({
  id,
  firstName,
  lastName,
  customerReference,
  role,
  privileges
}) => ({
  personId: id,
  firstName,
  lastName,
  crn: customerReference,
  role,
  privileges
})

export function transformBusinessCustomerPrivilegesToPermissionGroups(
  privileges,
  permissionGroups
) {
  const customerPermissionGroups = []

  for (const permissionGroup of permissionGroups) {
    for (const permission of permissionGroup.permissions) {
      if (permission.privilegeNames.some((privilegeName) => privileges.includes(privilegeName))) {
        customerPermissionGroups.push({
          id: permissionGroup.id,
          level: permission.level,
          functions: permission.functions
        })
      }
    }
  }

  return customerPermissionGroups
}

export const transformOrganisationToBusiness = (data) => {
  return {
    info: {
      name: data?.name,
      reference: data?.businessReference,
      vat: data?.taxRegistrationNumber,
      traderNumber: data?.traderNumber,
      vendorNumber: data?.vendorNumber,
      address: {
        pafOrganisationName: data?.address?.pafOrganisationName,
        buildingNumberRange: data?.address?.buildingNumberRange,
        buildingName: data?.address?.buildingName,
        flatName: data?.address?.flatName,
        street: data?.address?.street,
        city: data?.address?.city,
        county: data?.address?.county,
        postalCode: data?.address?.postalCode,
        country: data?.address?.country,
        uprn: data?.address?.uprn,
        dependentLocality: data?.address?.dependentLocality,
        doubleDependentLocality: data?.address?.doubleDependentLocality,
        typeId: data?.address?.addressTypeId
      },
      phone: {
        mobile: data?.mobile,
        landline: data?.landline,
        fax: data?.fax
      },
      email: {
        address: data?.email,
        validated: data?.emailValidated,
        doNotContact: data?.doNotContact || false
      },
      legalStatus: {
        code: data?.legalStatus?.id,
        type: data?.legalStatus?.type
      },
      type: {
        code: data?.businessType?.id,
        type: data?.businessType?.type
      },
      registrationNumbers: {
        companiesHouse: data?.companiesHouseRegistrationNumber,
        charityCommission: data?.charityCommissionRegistrationNumber
      }
    },
    organisationId: `${data?.id}`,
    sbi: `${data?.sbi}`
  }
}

export function transformCountyParishHoldings(data) {
  return [...data]
    .sort((a, b) => {
      const [aCounty, aParish, aHolding] = a.cph_number.split('/').map(Number)
      const [bCounty, bParish, bHolding] = b.cph_number.split('/').map(Number)

      return (
        aCounty - bCounty ||
        aParish - bParish ||
        aHolding - bHolding ||
        new Date(b.start_date) - new Date(a.start_date)
      )
    })
    .map(({ cph_number, end_date, parish, species, start_date, x, y, address }) => ({
      address,
      cphNumber: cph_number,
      endDate: end_date.split('T')[0],
      parish,
      species,
      startDate: start_date.split('T')[0],
      xCoordinate: x,
      yCoordinate: y
    }))
}
