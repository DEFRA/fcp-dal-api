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
  async info({ organisationId, info }, __, { dataSources }) {
    if (info) {
      return info
    }
    const response = await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
    return transformOrganisationToBusiness(response).info
  },

  land({ organisationId, sbi }) {
    return { organisationId, sbi }
  },

  async countyParishHoldings({ sbi }, __, context) {
    const countyParishHoldings =
      await getRuralPaymentsBusinessDataSource(context).getCountyParishHoldingsBySBI(sbi)

    return transformCountyParishHoldings(countyParishHoldings)
  },

  async customers({ organisationId }, _, { dataSources }) {
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )
    return transformOrganisationCustomers(customers)
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

    return transformOrganisationCustomer(customer)
  },

  async agreements({ sbi }, _, context) {
    const agreements = await getRuralPaymentsBusinessDataSource(context).getAgreementsBySBI(sbi)

    return transformAgreements(agreements)
  },

  async applications({ sbi }, _, context) {
    const applications = await getRuralPaymentsBusinessDataSource(context).getApplicationsBySBI(sbi)

    return transformApplications(applications)
  },

  async bankAccounts({ organisationId }, __, { dataSources }) {
    const organisation = await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
    const frn = organisation.businessReference

    if (!frn) {
      throw new NotFound('FRN not found for business')
    }

    const response = await dataSources.ruralPaymentsBusiness.getExistingBankAccounts(frn)
    return response?.accounts ?? []
  },

  async payments({ sbi }, { fromDate, toDate, userIP }, { dataSources }) {
    const organisation = await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)
    const frn = organisation.businessReference

    if (!frn) {
      throw new NotFound('FRN not found for business')
    }

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
  async permissionGroups({ privileges }, __, { dataSources }) {
    return transformBusinessCustomerPrivilegesToPermissionGroups(
      privileges,
      dataSources.permissions.getPermissionGroups()
    )
  }
}
