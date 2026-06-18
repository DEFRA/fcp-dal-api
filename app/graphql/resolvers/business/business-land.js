import { NotFound } from '../../../errors/graphql.js'
import {
  transformAndMergeParcelGeometries,
  transformLandCovers,
  transformLandCoversToArea,
  transformLandParcels,
  transformLandParcelsEffectiveDates,
  transformLandUses,
  transformTotalArea,
  transformTotalParcels
} from '../../../transformers/rural-payments/lms.js'
import { validateDateInput } from '../../../utils/date.js'
import { isFieldRequested } from '../../../utils/graphql.js'

export const BusinessLand = {
  summary({ organisationId }, { date }) {
    return { organisationId, date }
  },

  async parcel(
    { organisationId, sbi },
    { date = new Date(), parcelId, sheetId },
    { dataSources },
    info
  ) {
    validateDateInput(date)

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

  async parcels({ organisationId }, { date = new Date() }, { dataSources }, info) {
    validateDateInput(date)

    const parcels = transformLandParcels(
      await dataSources.ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate(
        organisationId,
        date
      )
    )

    if (!isFieldRequested(info, 'geometry')) {
      return parcels
    }

    const parcelGeometries =
      await dataSources.ruralPaymentsBusiness.getGeometriesByOrganisationIdAndDate(
        organisationId,
        date
      )

    return transformAndMergeParcelGeometries(parcels, parcelGeometries)
  },

  async parcelCovers(
    { organisationId },
    { date = new Date(), sheetId, parcelId },
    { dataSources },
    info
  ) {
    validateDateInput(date)

    const parcel = await BusinessLand.parcel(
      { organisationId },
      { date, sheetId, parcelId },
      { dataSources }
    )

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

  async parcelLandUses({ sbi }, { sheetId, parcelId, date = new Date() }, { dataSources }) {
    validateDateInput(date)

    return transformLandUses(
      await dataSources.ruralPaymentsBusiness.getLandUseByBusinessParcel(
        sbi,
        sheetId,
        parcelId,
        date
      )
    )
  }
}

const getParcelEffectiveDates = async (
  dataSources,
  { organisationId, date, parcelId, sheetId }
) => {
  const parclsWithAffectiveDates =
    await dataSources.ruralPaymentsBusiness.getParcelEffectiveDatesByOrganisationIdAndDate(
      organisationId,
      date
    )

  return transformLandParcelsEffectiveDates(parcelId, sheetId, parclsWithAffectiveDates)
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
