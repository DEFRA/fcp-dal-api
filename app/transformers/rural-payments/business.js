import { validateDate } from '../../utils/date.js'
import { transformMapping } from '../../utils/mapping.js'
import { convertSquareMetersToHectares } from '../../utils/numbers.js'
import {
  booleanise,
  dalAddressToKitsAddress,
  kitsAddressToDalAddress,
  transformEntityStatus
} from '../common.js'

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

export const transformOrganisationToBusiness = (data) => ({
  info: {
    name: data?.name,
    reference: data?.businessReference,
    vat: data?.taxRegistrationNumber,
    traderNumber: data?.traderNumber,
    vendorNumber: data?.vendorNumber,
    address: kitsAddressToDalAddress(data?.address),
    correspondenceAddress:
      (data?.correspondenceAddress && kitsAddressToDalAddress(data.correspondenceAddress)) || null,
    phone: {
      mobile: data?.mobile,
      landline: data?.landline,
      fax: data?.fax
    },
    correspondencePhone: {
      mobile: data?.correspondenceMobile,
      landline: data?.correspondenceLandline,
      fax: data?.correspondenceFax
    },
    email: {
      address: data?.email,
      validated: data?.emailValidated
    },
    correspondenceEmail: {
      address: data?.correspondenceEmail,
      validated: booleanise(data?.correspondenceEmailValidated)
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
    additionalSbis: data?.additionalSbiIds || [],
    isAccountablePeopleDeclarationCompleted: booleanise(
      data?.isAccountablePeopleDeclarationCompleted
    ),
    dateStartedFarming: data?.dateStartedFarming ? new Date(data.dateStartedFarming) : null,
    lastUpdated: data?.lastUpdatedOn ? new Date(data.lastUpdatedOn) : null,
    landConfirmed: booleanise(data?.landConfirmed),
    isFinancialToBusinessAddress: booleanise(data?.isFinancialToBusinessAddr),
    isCorrespondenceAsBusinessAddress: booleanise(data?.isCorrespondenceAsBusinessAddr),
    hasLandInNorthernIreland: booleanise(data?.hasLandInNorthernIreland),
    hasLandInScotland: booleanise(data?.hasLandInScotland),
    hasLandInWales: booleanise(data?.hasLandInWales),
    hasAdditionalBusinessActivities: booleanise(data?.hasAdditionalBusinessActivities),
    additionalBusinessActivities:
      data?.additionalBusinessActivities?.map(({ id, type }) => ({ code: id, type })) || [],
    status: transformEntityStatus(data)
  },
  organisationId: `${data?.id}`,
  sbi: `${data?.sbi}`
})

const orgDetailsUpdateMapping = {
  name: (data) => data.name,
  address: (data) => (data.address ? dalAddressToKitsAddress(data.address) : undefined),
  correspondenceAddress: (data) =>
    data.correspondenceAddress ? dalAddressToKitsAddress(data.correspondenceAddress) : undefined,
  isCorrespondenceAsBusinessAddr: (data) => data.isCorrespondenceAsBusinessAddress,
  email: (data) => data.email?.address,
  landline: (data) => data.phone?.landline,
  mobile: (data) => data.phone?.mobile,
  correspondenceEmail: (data) => data.correspondenceEmail?.address,
  correspondenceLandline: (data) => data.correspondencePhone?.landline,
  correspondenceMobile: (data) => data.correspondencePhone?.mobile
}

export const transformBusinessDetailsToOrgDetailsUpdate = (data) => {
  return transformMapping(orgDetailsUpdateMapping, data)
}

const orgAdditionalDetailsMapping = {
  companiesHouseRegistrationNumber: (data) =>
    data.registrationNumbers ? data.registrationNumbers.companiesHouse : undefined,
  charityCommissionRegistrationNumber: (data) =>
    data.registrationNumbers ? data.registrationNumbers?.charityCommission : undefined,
  businessType: (data) =>
    data.typeCode
      ? {
          id: data.typeCode
        }
      : undefined,
  dateStartedFarming: (data) =>
    data.dateStartedFarming ? new Date(data.dateStartedFarming).toISOString() : undefined,
  legalStatus: (data) =>
    data.legalStatusCode
      ? {
          id: data.legalStatusCode
        }
      : undefined
}

export const transformBusinesDetailsToOrgAdditionalDetailsUpdate = (data) => {
  return transformMapping(orgAdditionalDetailsMapping, data)
}

const fullOrgDetailsMapping = {
  ...orgDetailsUpdateMapping,
  ...orgAdditionalDetailsMapping,
  landConfirmed: (data) => data?.landConfirmed,
  traderNumber: (data) => data?.traderNumber,
  vendorNumber: (data) => data?.vendorNumber,
  taxRegistrationNumber: (data) => data?.vat
}

export const transformBusinessDetailsToOrgDetailsCreate = (data) => {
  return transformMapping(fullOrgDetailsMapping, data)
}

export function transformCountyParishHoldings(data) {
  if (!Array.isArray(data)) {
    return null
  }

  return data
    .toSorted((a, b) => {
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
      endDate: end_date?.split('T')[0] || null,
      parish,
      species,
      startDate: start_date?.split('T')[0] || null,
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
    startDate: validateDate(agreement.start_date?.split('T')[0]).toISOString(),
    endDate: validateDate(agreement.end_date?.split('T')[0]).toISOString(),
    paymentSchedules: agreement.payment_schedules.map(transformPaymentSchedule)
  }
}

function transformPaymentSchedule(paymentSchedule) {
  return {
    optionCode: paymentSchedule.option_code,
    optionDescription: paymentSchedule.option_description,
    commitmentGroupStartDate: validateDate(
      paymentSchedule.commitment_group_start_date?.split('T')[0]
    ).toISOString(),
    commitmentGroupEndDate: validateDate(
      paymentSchedule.commitment_group_end_date?.split('T')[0]
    ).toISOString(),
    year: paymentSchedule.year,
    sheetName: paymentSchedule.sheet_name,
    parcelName: paymentSchedule.parcel_name,
    actionArea: convertSquareMetersToHectares(paymentSchedule.action_area),
    actionMTL: paymentSchedule.action_mtl,
    actionUnits: paymentSchedule.action_units,
    parcelTotalArea: convertSquareMetersToHectares(paymentSchedule.parcel_total_area),
    startDate: validateDate(
      paymentSchedule.payment_schedule_start_date?.split('T')[0]
    ).toISOString(),
    endDate: validateDate(paymentSchedule.payment_schedule_end_date?.split('T')[0]).toISOString()
  }
}
