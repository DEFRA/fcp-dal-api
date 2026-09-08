import { NotFound } from '../../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../../logger/codes.js'
import { logger } from '../../../logger/logger.js'
import { transformBusinessPayments } from '../../../transformers/hitachi/payments.js'
import {
  transformAgreements,
  transformApplications,
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformCountyParishHoldings,
  transformOrganisationCustomer,
  transformOrganisationCustomers,
  transformOrganisationToBusiness
} from '../../../transformers/rural-payments/business.js'
import { getRuralPaymentsBusinessDataSource } from './common.js'

export const Business = {
  async info({ organisationId, sbi, info: businessInfo }, __, { dataSources, auditTrail }, info) {
    if (businessInfo) {
      return businessInfo
    }
    auditTrail?.recordEntity(info, { entity: 'business', action: 'read', entityid: sbi })
    const response = await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)

    return transformOrganisationToBusiness(response).info
  },

  land({ organisationId, sbi }) {
    return { organisationId, sbi }
  },

  async countyParishHoldings({ sbi }, __, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, { entity: 'cph-list', action: 'read', entityid: sbi })
    const countyParishHoldings = await getRuralPaymentsBusinessDataSource({
      ...context,
      useServiceAccountForExternal: true
    }).getCountyParishHoldingsBySBI(sbi)

    return transformCountyParishHoldings(countyParishHoldings)
  },

  async customers({ organisationId, sbi }, _, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, { entity: 'person-list', action: 'read', entityid: sbi })
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    return transformOrganisationCustomers(customers, sbi)
  },

  async customer({ organisationId, sbi }, { crn }, { dataSources }) {
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    const customer = customers.find(({ customerReference }) => customerReference === crn)

    if (!customer) {
      logger.warn('Could not find customer in business', {
        crn,
        organisationId,
        sbi,
        code: RURALPAYMENTS_API_NOT_FOUND_001
      })
      throw new NotFound('Customer not found')
    }

    return transformOrganisationCustomer(customer, sbi)
  },

  async agreements({ sbi }, _, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, { entity: 'agreement-list', action: 'read', entityid: sbi })
    const agreements = await getRuralPaymentsBusinessDataSource({
      ...context,
      useServiceAccountForExternal: true
    }).getAgreementsBySBI(sbi)

    return transformAgreements(agreements)
  },

  async applications({ sbi }, _, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, { entity: 'application-list', action: 'read', entityid: sbi })
    const applications = await getRuralPaymentsBusinessDataSource({
      ...context,
      useServiceAccountForExternal: true
    }).getApplicationsBySBI(sbi)

    return transformApplications(applications)
  },

  async permittedFunctions({ organisationId }, { functions }, { dataSources }) {
    const authorisedFunctions =
      await dataSources.ruralPaymentsBusiness.getAuthorisedFunctionsByOrganisationId(
        organisationId,
        functions
      )

    return functions.map((name) => ({ name, permitted: authorisedFunctions?.[name] ?? false }))
  },

  async bankAccounts({ organisationId }, __, { dataSources, auditTrail }, info) {
    const organisation = await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
    const frn = organisation.businessReference

    if (!frn) {
      throw new NotFound('FRN not found for business')
    }
    auditTrail?.recordAccount(info, 'frn', frn)
    auditTrail?.recordEntity(info, { entity: 'bank-account', action: 'read', entityid: frn })
    const response = await dataSources.ruralPaymentsBusiness.getExistingBankAccounts(frn)
    return response?.accounts ?? []
  },

  async payments({ sbi }, { fromDate, toDate, userIP }, { dataSources, auditTrail }, info) {
    const organisation = await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)
    const frn = organisation.businessReference

    if (!frn) {
      throw new NotFound('FRN not found for business')
    }

    auditTrail?.recordAccount(info, 'frn', frn)
    auditTrail?.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: frn })

    const payments = await dataSources.hitachiPayments.getSupplierPayments({
      frn,
      fromDate,
      toDate,
      userIP,
      resourceId: sbi
    })

    return transformBusinessPayments(payments)
  }
}

export const BusinessCustomer = {
  async permissionGroups(
    { privileges, sbi, crn, personId },
    __,
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordAccount(info, 'crn', crn)
    auditTrail?.recordAccount(info, 'personId', personId)
    auditTrail?.recordEntity(info, {
      entity: 'permission-list',
      action: 'read',
      entityid: `${sbi}-${crn}`
    })
    return transformBusinessCustomerPrivilegesToPermissionGroups(
      privileges,
      dataSources.permissions.getPermissionGroups()
    )
  }
}
