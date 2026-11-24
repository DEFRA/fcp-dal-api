import { NotFound } from '../../../errors/graphql.js'
import {
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcelGeometries,
  transformLandParcels,
  transformLandParcelsEffectiveDates,
  transformLandUses,
  transformTotalArea,
  transformTotalParcels
} from '../../../transformers/rural-payments/lms.js'
import { validateDateInput } from '../../../utils/date.js'
import { isFieldRequested } from '../../../utils/graphql.js'
import { getRuralPaymentsBusinessDataSource } from './common.js'
import { parcelGeometryKey } from '../../../data-sources/rural-payments/RuralPaymentsBusiness.js'

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

    // Pass info through so that parcels can tell whether geometry has been requested
    const parcels = await BusinessLand.parcels({ organisationId }, { date }, { dataSources }, info)
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

    // If geometry is requested, fetch the organisation's geometries in parallel with the parcels.
    // The catch stops an unhandled rejection if the parcels request fails first.
    const geometriesPromise = isFieldRequested(info, 'geometry')
      ? dataSources.ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate(
          organisationId,
          date
        )
      : undefined
    geometriesPromise?.catch(() => {})

    const parcels = transformLandParcels(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate(
        organisationId,
        date
      )
    )

    // Attach each parcel's geometry here, so that the geometry field resolver can return it
    // synchronously: for large organisations, 23k async field resolvers awaiting the geometries
    // added significant memory (promises, closures, contexts) and CPU.  If the geometries request
    // fails, the parcels are still returned, and the geometry field resolver surfaces the error
    // for each parcel's geometry, as it would without this.
    const geometries = await geometriesPromise?.catch(() => undefined)

    // Parcel field resolvers (e.g. geometry) need the organisation and date
    return parcels.map((parcel) => ({
      ...parcel,
      organisationId,
      date,
      ...(geometries && {
        geometry: geometries.get(parcelGeometryKey(parcel.sheetId, parcel.parcelId)) ?? null
      })
    }))
  },

  async geometries(
    { organisationId, sbi },
    { date = new Date() },
    { dataSources, auditTrail },
    info
  ) {
    auditTrail?.recordEntity(info, {
      entity: 'parcel-geometries',
      action: 'read',
      entityid: sbi
    })
    validateDateInput(date)

    return transformLandParcelGeometries(
      await dataSources.ruralPaymentsBusiness.getParcelGeometriesByOrganisationIdAndDate(
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

    // Land cover geometries make the upstream response much larger, so only request them when the
    // geometry field has been selected
    const includeGeometries = isFieldRequested(info, 'geometry')

    return transformLandCovers(
      await dataSources.ruralPaymentsBusiness.getCoversByOrgSheetParcelIdDate(
        organisationId,
        parcel.sheetId,
        parcelId,
        date,
        includeGeometries
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
  // Not async: when the parcels resolver has attached the geometry (the usual case) it is returned
  // synchronously, avoiding a promise per parcel
  geometry(parcel, __, { dataSources }) {
    if (parcel.geometry !== undefined) {
      return parcel.geometry
    }

    const { organisationId, date, sheetId, parcelId } = parcel
    return dataSources.ruralPaymentsBusiness
      .getParcelGeometryMapByOrganisationIdAndDate(organisationId, date)
      .then((geometries) => geometries.get(parcelGeometryKey(sheetId, parcelId)) ?? null)
  },

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
