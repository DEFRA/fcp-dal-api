import { validateDate } from '../../utils/date.js'
import { booleanise, transformAddress, transformEntityStatus } from '../common.js'

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
    address: transformAddress(data?.address),
    correspondenceAddress:
      (data?.correspondenceAddress && transformAddress(data.correspondenceAddress)) || null,
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
    actionArea: paymentSchedule.action_area,
    actionMTL: paymentSchedule.action_mtl,
    actionUnits: paymentSchedule.action_units,
    parcelTotalArea: paymentSchedule.parcel_total_area,
    startDate: validateDate(
      paymentSchedule.payment_schedule_start_date?.split('T')[0]
    ).toISOString(),
    endDate: validateDate(paymentSchedule.payment_schedule_end_date?.split('T')[0]).toISOString()
  }
}
