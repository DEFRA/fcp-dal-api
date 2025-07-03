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
        line1: data?.address?.address1,
        line2: data?.address?.address2,
        line3: data?.address?.address3,
        line4: data?.address?.address4,
        line5: data?.address?.address5,
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
      correspondenceAddress: {
        line1: data?.correspondenceAddress?.correspondenceAddress1,
        line2: data?.correspondenceAddress?.correspondenceAddress2,
        line3: data?.correspondenceAddress?.correspondenceAddress3,
        line4: data?.correspondenceAddress?.correspondenceAddress4,
        line5: data?.correspondenceAddress?.correspondenceAddress5,
        pafOrganisationName: data?.correspondenceAddress?.pafOrganisationName,
        buildingNumberRange: data?.correspondenceAddress?.buildingNumberRange,
        buildingName: data?.correspondenceAddress?.buildingName,
        flatName: data?.correspondenceAddress?.flatName,
        street: data?.correspondenceAddress?.street,
        city: data?.correspondenceAddress?.city,
        county: data?.correspondenceAddress?.county,
        postalCode: data?.correspondenceAddress?.postalCode,
        country: data?.correspondenceAddress?.country,
        uprn: data?.correspondenceAddress?.uprn,
        dependentLocality: data?.correspondenceAddress?.dependentLocality,
        doubleDependentLocality: data?.correspondenceAddress?.doubleDependentLocality,
        typeId: data?.correspondenceAddress?.correspondenceAddressTypeId
      },
      phone: {
        mobile: data?.mobile,
        landline: data?.landline
      },
      correspondencePhone: {
        mobile: data?.correspondenceMobile,
        landline: data?.correspondenceLandline
      },
      email: {
        address: data?.email,
        validated: data?.emailValidated
      },
      correspondenceEmail: {
        address: data?.correspondenceEmail,
        validated: data?.correspondenceEmailValidated
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
      },
      isCorrespondenceAsBusinessAddr: data?.isCorrespondenceAsBusinessAddr
    },
    organisationId: `${data?.id}`,
    sbi: `${data?.sbi}`
  }
}

const orgDetailsUpdateMapping = {
  name: (data) => data.name,
  address: {
    address1: (data) => data.address?.line1,
    address2: (data) => data.address?.line2,
    address3: (data) => data.address?.line3,
    address4: (data) => data.address?.line4,
    address5: (data) => data.address?.line5,
    pafOrganisationName: (data) => data.address?.pafOrganisationName,
    flatName: (data) => data.address?.flatName,
    buildingNumberRange: (data) => data.address?.buildingNumberRange,
    buildingName: (data) => data.address?.buildingName,
    street: (data) => data.address?.street,
    city: (data) => data.address?.city,
    county: (data) => data.address?.county,
    postalCode: (data) => data.address?.postalCode,
    country: (data) => data.address?.country,
    uprn: (data) => data.address?.uprn,
    dependentLocality: (data) => data.address?.dependentLocality,
    doubleDependentLocality: (data) => data.address?.doubleDependentLocality
  },
  // fallback to null here as the API does not allow unsetting correspondonce address.
  correspondenceAddress: (data) => data.correspondenceAddress || null,
  isCorrespondenceAsBusinessAddr: (data) => data.isCorrespondenceAsBusinessAddr,
  email: (data) => data.email?.address,
  landline: (data) => data.phone?.landline,
  mobile: (data) => data.phone?.mobile,
  correspondenceEmail: (data) => data.correspondenceEmail?.address,
  correspondenceLandline: (data) => data.correspondencePhone?.landline,
  correspondenceMobile: (data) => data.correspondencePhone?.mobile,
  // Oddly this is required but cannot actually be changed.
  businessType: {
    id: () => 0
  }
}

export const transformBusinessDetailsToOrgDetailsUpdate = (data) => {
  const transform = (mapping) => {
    if (typeof mapping === 'function') return mapping(data)
    if (typeof mapping === 'object') {
      return Object.entries(mapping).reduce((acc, [key, val]) => {
        acc[key] = transform(val)
        return acc
      }, {})
    }
    return undefined
  }

  return transform(orgDetailsUpdateMapping)
}

export const hasUndefinedFieldsInOrgDetailsUpdate = (data) => {
  const checkUndefined = (mapping) => {
    if (typeof mapping === 'function') {
      const val = mapping(data)
      return val === undefined
    }
    if (typeof mapping === 'object') {
      return Object.values(mapping).some(checkUndefined)
    }
    return false
  }

  return checkUndefined(orgDetailsUpdateMapping)
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

export function transformAgreements(agreements) {
  return agreements.map(transformAgreement)
}

function transformAgreement(agreement) {
  return {
    contractId: agreement.contract_id,
    name: agreement.agreement_name,
    status: agreement.status,
    contractType: agreement.contract_type,
    schemeYear: agreement.scheme_year,
    startDate: agreement.start_date,
    endDate: agreement.end_date,
    paymentSchedules: agreement.payment_schedules.map(transformPaymentSchedule)
  }
}

function transformPaymentSchedule(paymentSchedule) {
  return {
    optionCode: paymentSchedule.option_code,
    optionDescription: paymentSchedule.option_description,
    commitmentGroupStartDate: paymentSchedule.commitment_group_start_date,
    commitmentGroupEndDate: paymentSchedule.commitment_group_end_date,
    year: paymentSchedule.year,
    sheetName: paymentSchedule.sheet_name,
    parcelName: paymentSchedule.parcel_name,
    actionArea: paymentSchedule.action_area,
    actionMTL: paymentSchedule.action_mtl,
    actionUnits: paymentSchedule.action_units,
    parcelTotalArea: paymentSchedule.parcel_total_area,
    startDate: paymentSchedule.payment_schedule_start_date,
    endDate: paymentSchedule.payment_schedule_end_date
  }
}
