import { checkUndefinedInMapping, transformMapping } from '../../utils/mapping.js'

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

function orgAddressToBusinessAddress(address) {
  return {
    line1: address?.address1,
    line2: address?.address2,
    line3: address?.address3,
    line4: address?.address4,
    line5: address?.address5,
    pafOrganisationName: address?.pafOrganisationName,
    buildingNumberRange: address?.buildingNumberRange,
    buildingName: address?.buildingName,
    flatName: address?.flatName,
    street: address?.street,
    city: address?.city,
    county: address?.county,
    postalCode: address?.postalCode,
    country: address?.country,
    uprn: address?.uprn,
    dependentLocality: address?.dependentLocality,
    doubleDependentLocality: address?.doubleDependentLocality,
    typeId: address?.addressTypeId
  }
}

function businessAddressToOrgAddress(address) {
  return {
    address1: address?.line1,
    address2: address?.line2,
    address3: address?.line3,
    address4: address?.line4,
    address5: address?.line5,
    pafOrganisationName: address?.pafOrganisationName,
    buildingNumberRange: address?.buildingNumberRange,
    buildingName: address?.buildingName,
    flatName: address?.flatName,
    street: address?.street,
    city: address?.city,
    county: address?.county,
    postalCode: address?.postalCode,
    country: address?.country,
    uprn: address?.uprn,
    dependentLocality: address?.dependentLocality,
    doubleDependentLocality: address?.doubleDependentLocality,
    typeId: address?.addressTypeId
  }
}

export const transformOrganisationToBusiness = (data) => {
  return {
    info: {
      name: data?.name,
      reference: data?.businessReference,
      vat: data?.taxRegistrationNumber,
      traderNumber: data?.traderNumber,
      vendorNumber: data?.vendorNumber,
      address: orgAddressToBusinessAddress(data?.address),
      correspondenceAddress: orgAddressToBusinessAddress(data?.correspondenceAddress),
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
  address: (data) => businessAddressToOrgAddress(data.address),
  // fallback to null here as the API does not allow unsetting correspondonce address.
  correspondenceAddress: (data) =>
    data.correspondenceAddress === null
      ? null
      : businessAddressToOrgAddress(data.correspondenceAddress),
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
  return transformMapping(orgDetailsUpdateMapping, data)
}

export const hasUndefinedFieldsInOrgDetailsUpdate = (data) => {
  return checkUndefinedInMapping(orgDetailsUpdateMapping, data)
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
