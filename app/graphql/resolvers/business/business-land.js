import { NotFound } from '../../../errors/graphql.js'
import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels,
  transformLandParcelsEffectiveDates,
  transformLandUses,
  transformTotalArea,
  transformTotalParcels
} from '../../../transformers/rural-payments/lms.js'
import { validateDateInput } from '../../../utils/date.js'
import { getRuralPaymentsBusinessDataSource } from './common.js'

export const BusinessLand = {
  summary({ organisationId, sbi }, { date }, { auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'land-summary',
      action: 'read',
      entityid: sbi
    })

    return { organisationId, date }
  },

  async parcel(
    { organisationId, sbi },
    { date = new Date(), parcelId, sheetId },
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordEntity(info, {
      entity: 'parcel',
      action: 'read',
      entityid: `${sheetId}-${parcelId}`
    })
    validateDateInput(date)

    const parcels = await BusinessLand.parcels({ organisationId }, { date }, { dataSources })
    const parcel = parcels?.find((p) => p.sheetId === sheetId && p.parcelId === parcelId)
    if (!parcel) {
      throw new NotFound(`No parcel found for sheetId: ${sheetId} and parcelId: ${parcelId}`)
    }

    return {
      ...parcel,
      organisationId,
      sbi,
      date
    }
  },

  async parcels({ organisationId, sbi }, { date = new Date() }, { dataSources, auditTrail }, info) {
    auditTrail?.recordEntity(info, {
      entity: 'parcel-list',
      action: 'read',
      entityid: sbi
    })
    validateDateInput(date)

    return transformLandParcels(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate(
        organisationId,
        date
      )
    )
  },

  async parcelCovers(
    { organisationId },
    { date = new Date(), sheetId, parcelId },
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordEntity(info, {
      entity: 'land-cover-list',
      action: 'read',
      entityid: `${sheetId}-${parcelId}`
    })
    validateDateInput(date)

    const parcel = await BusinessLand.parcel(
      { organisationId },
      { date, sheetId, parcelId },
      { dataSources }
    )

    return transformLandCovers(
      await dataSources.ruralPaymentsBusiness.getCoversByOrgSheetParcelIdDate(
        organisationId,
        parcel.sheetId,
        parcelId,
        date
      )
    )
  },

  async parcelLandUses({ sbi }, { sheetId, parcelId, date = new Date() }, context, info) {
    const { auditTrail } = context
    auditTrail?.recordEntity(info, {
      entity: 'land-use-list',
      action: 'read',
      entityid: `${sheetId}-${parcelId}`
    })
    validateDateInput(date)

    return transformLandUses(
      await getRuralPaymentsBusinessDataSource({
        ...context,
        useServiceAccountForExternal: true
      }).getLandUseByBusinessParcel(sbi, sheetId, parcelId, date)
    )
  }
}

const getParcelEffectiveDates = async (
  dataSources,
  { organisationId, date, parcelId, sheetId }
) => {
  const parcelsWithAffectiveDates =
    await dataSources.ruralPaymentsBusiness.getParcelEffectiveDatesByOrganisationIdAndDate(
      organisationId,
      date
    )

  return transformLandParcelsEffectiveDates(parcelId, sheetId, parcelsWithAffectiveDates)
}

export const BusinessLandParcel = {
  async effectiveToDate(parcel, __, { dataSources }) {
    const { effectiveTo } = await getParcelEffectiveDates(dataSources, parcel)

    return effectiveTo
  },

  async effectiveFromDate(parcel, __, { dataSources }) {
    const { effectiveFrom } = await getParcelEffectiveDates(dataSources, parcel)

    return effectiveFrom
  }
}

export const BusinessLandSummary = {
  async totalParcels({ organisationId, date = new Date() }, __, { dataSources }) {
    return transformTotalParcels(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate(
        organisationId,
        date
      )
    )
  },

  async totalArea({ organisationId, date = new Date() }, __, { dataSources }) {
    return transformTotalArea(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate(
        organisationId,
        date
      )
    )
  },

  async arableLandArea({ organisationId, date = new Date() }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Arable Land',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        organisationId,
        date
      )
    )
  },

  async permanentGrasslandArea({ organisationId, date = new Date() }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Grassland',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        organisationId,
        date
      )
    )
  },

  async permanentCropsArea({ organisationId, date = new Date() }, __, { dataSources }) {
    return transformLandCoversToArea(
      'Permanent Crops',
      await dataSources.ruralPaymentsBusiness.getCoversSummaryByOrganisationIdAndDate(
        organisationId,
        date
      )
    )
  }
}
