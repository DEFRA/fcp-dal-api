import { NotFound } from '../../../errors/graphql.js'
import { RURALPAYMENTS_API_NOT_FOUND_001 } from '../../../logger/codes.js'
import { maskAllButLastFour } from '../../../logger/utils.js'
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
import { validateDateInput } from '../../../utils/date.js'
import { getRuralPaymentsBusinessDataSource } from './common.js'

/**
 * @import {
 *   BusinessCustomerArgs,
 *   BusinessPaymentsArgs,
 *   BusinessPermittedFunctionsArgs,
 *   GraphQLResolveInfo,
 *   ResolverContext
 * } from '../types.js'
 */

/**
 * The business returned by `Query.business` and the business mutations
 * @typedef {object} BusinessParent
 * @property {string} sbi Single Business Identifier: a unique 9-digit number
 * @property {string} organisationId the Rural Payments id of the business
 * @property {object} [info] the business info, when the parent resolver has already fetched it
 */

export const Business = {
  /**
   * @param {BusinessParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async info({ organisationId, sbi, info: businessInfo }, __, { dataSources, auditTrail }, info) {
    if (businessInfo) {
      return businessInfo
    }
    auditTrail?.recordEntity(info, { entity: 'business', action: 'read', entityid: sbi })
    const response = await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)

    return transformOrganisationToBusiness(response).info
  },

  /**
   * @param {BusinessParent} parent
   */
  land({ organisationId, sbi }) {
    return { organisationId, sbi }
  },

  /**
   * @param {BusinessParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async countyParishHoldings({ sbi }, __, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, { entity: 'cph-list', action: 'read', entityid: sbi })
    const countyParishHoldings = await getRuralPaymentsBusinessDataSource({
      ...context,
      useServiceAccountForExternal: true
    }).getCountyParishHoldingsBySBI(sbi)

    return transformCountyParishHoldings(countyParishHoldings)
  },

  /**
   * @param {BusinessParent} parent
   * @param {unknown} _
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async customers({ organisationId, sbi }, _, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, { entity: 'person-list', action: 'read', entityid: sbi })
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    return transformOrganisationCustomers(customers, sbi)
  },

  /**
   * @param {BusinessParent} parent
   * @param {BusinessCustomerArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async customer(
    { organisationId, sbi },
    { crn },
    { dataSources, auditTrail, requestLogger },
    info
  ) {
    auditTrail?.recordEntity(info, { entity: 'person-list', action: 'read', entityid: sbi })
    auditTrail?.recordAccount(info, 'crn', crn)
    const customers =
      await dataSources.ruralPaymentsBusiness.getOrganisationCustomersByOrganisationId(
        organisationId
      )

    const customer = customers.find(({ customerReference }) => customerReference === crn)

    if (!customer) {
      // the sbi and the full crn are sensitive, so the business is named by its organisation id
      // and the customer by the last four digits of the crn
      requestLogger.warn(
        `Could not find customer in business (organisation ID: ${organisationId}, CRN: ${maskAllButLastFour(crn)})`,
        { organisationId, code: RURALPAYMENTS_API_NOT_FOUND_001 }
      )
      throw new NotFound('Customer not found')
    }
    auditTrail?.recordAccount(info, 'personId', customer.id)
    return transformOrganisationCustomer(customer, sbi)
  },

  /**
   * @param {BusinessParent} parent
   * @param {unknown} _
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async agreements({ sbi }, _, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, { entity: 'agreement-list', action: 'read', entityid: sbi })
    const agreements = await getRuralPaymentsBusinessDataSource({
      ...context,
      useServiceAccountForExternal: true
    }).getAgreementsBySBI(sbi)

    return transformAgreements(agreements)
  },

  /**
   * @param {BusinessParent} parent
   * @param {unknown} _
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async applications({ sbi }, _, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, { entity: 'application-list', action: 'read', entityid: sbi })
    const applications = await getRuralPaymentsBusinessDataSource({
      ...context,
      useServiceAccountForExternal: true
    }).getApplicationsBySBI(sbi)

    return transformApplications(applications)
  },

  /**
   * @param {BusinessParent} parent
   * @param {BusinessPermittedFunctionsArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async permittedFunctions(
    { organisationId, sbi },
    { functions },
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordEntity(info, {
      entity: 'permitted-function-list',
      action: 'read',
      entityid: sbi
    })
    const authorisedFunctions =
      await dataSources.ruralPaymentsBusiness.getAuthorisedFunctionsByOrganisationId(
        organisationId,
        functions
      )

    return functions.map((name) => ({ name, permitted: authorisedFunctions?.[name] ?? false }))
  },

  /**
   * @param {BusinessParent} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async bankAccounts({ organisationId }, __, { dataSources, auditTrail }, info) {
    let frn
    try {
      const organisation =
        await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
      frn = organisation.businessReference
    } finally {
      if (frn) {
        auditTrail?.recordAccount(info, 'frn', frn)
      }
      auditTrail?.recordEntity(info, { entity: 'bank-account', action: 'read', entityid: frn })
    }

    if (!frn) {
      throw new NotFound('FRN not found for business')
    }
    const response = await dataSources.ruralPaymentsBusiness.getExistingBankAccounts(frn)
    return response?.accounts ?? []
  },

  /**
   * @param {BusinessParent} parent
   * @param {BusinessPaymentsArgs} args
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async payments({ sbi }, { fromDate, toDate, userIP }, { dataSources, auditTrail }, info) {
    // the Date scalar is passed through as a string, so convert it before use
    fromDate = fromDate && validateDateInput(fromDate)
    toDate = toDate && validateDateInput(toDate)

    let frn
    try {
      const organisation = await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)
      frn = organisation.businessReference
    } finally {
      if (frn) {
        auditTrail?.recordAccount(info, 'frn', frn)
      }
      auditTrail?.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: frn })
    }

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
  /**
   * @param {{ privileges: string[], sbi: string, crn: string }} parent
   * @param {unknown} __
   * @param {ResolverContext} context
   * @param {GraphQLResolveInfo} info
   */
  async permissionGroups({ privileges, sbi, crn }, __, { dataSources, auditTrail }, info) {
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
