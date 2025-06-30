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
      correspondenceAddress:
        (data?.correspondenceAddress && {
          line1: data.correspondenceAddress.address1,
          line2: data.correspondenceAddress.address2,
          line3: data.correspondenceAddress.address3,
          line4: data.correspondenceAddress.address4,
          line5: data.correspondenceAddress.address5,
          pafOrganisationName: data.correspondenceAddress.pafOrganisationName,
          buildingNumberRange: data.correspondenceAddress.buildingNumberRange,
          buildingName: data.correspondenceAddress.buildingName,
          flatName: data.correspondenceAddress.flatName,
          street: data.correspondenceAddress.street,
          city: data.correspondenceAddress.city,
          county: data.correspondenceAddress.county,
          postalCode: data.correspondenceAddress.postalCode,
          country: data.correspondenceAddress.country,
          uprn: data.correspondenceAddress.uprn,
          dependentLocality: data.correspondenceAddress.dependentLocality,
          doubleDependentLocality: data.correspondenceAddress.doubleDependentLocality,
          typeId: data.correspondenceAddress.addressTypeId
        }) ||
        null,
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
        validated: data?.emailValidated,
        doNotContact: data?.doNotContact || false
      },
      correspondenceEmail: {
        address: data?.correspondenceEmail,
        validated: data?.correspondenceEmailValidated || false
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
      confirmed: data?.confirmed || false,
      isAccountablePeopleDeclarationCompleted:
        data?.isAccountablePeopleDeclarationCompleted || false,
      dateStartedFarming: data?.dateStartedFarming ? new Date(data.dateStartedFarming) : null,
      lastUpdated: data?.lastUpdatedOn ? new Date(data.lastUpdatedOn) : null,
      landConfirmed: data?.landConfirmed || false,
      deactivated: data?.deactivated || false,
      locked: data?.locked || false,
      isFinancialToBusinessAddress: data?.isFinancialToBusinessAddr || false,
      isCorrespondenceAsBusinessAddress: data?.isCorrespondenceAsBusinessAddr || false,
      hasLandInNorthernIreland: data?.hasLandInNorthernIreland || false,
      hasLandInScotland: data?.hasLandInScotland || false,
      hasLandInWales: data?.hasLandInWales || false,
      hasAdditionalBusinessActivities: data?.hasAdditionalBusinessActivities || false,
      additionalBusinessActivities:
        data?.additionalBusinessActivities?.map(({ id, type }) => ({ code: id, type })) || []
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
