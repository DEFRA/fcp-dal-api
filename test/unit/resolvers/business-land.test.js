import {
  BusinessLand,
  BusinessLandSummary
} from '../../../app/graphql/resolvers/business/business-land.js'

describe('BusinessLand', () => {
  const mockBusiness = { organisationId: 'mockId' }
  const mockArguments = { date: '2022-01-01' }

  let dataSources
  let getParcelsByOrganisationIdAndDateResult
  let getCoversByOrgSheetParcelIdDateResult
  let getCoversSummaryByOrganisationIdAndDateResult
  let getLandUseByBusinessParcelResult

  beforeEach(() => {
    getParcelsByOrganisationIdAndDateResult = [
      {
        id: 'mockId',
        parcelId: 'mockParcelId',
        sheetId: 'mockSheetId',
        area: 1000,
        pendingDigitisation: false
      }
    ]
    getCoversByOrgSheetParcelIdDateResult = {
      type: 'FeatureCollection',
      features: [
        {
          id: '11033654',
          geometry: null,
          properties: {
            area: '1000',
            code: 'someCode',
            name: 'Mock Name',
            isBpsEligible: 'true'
          },
          type: 'Feature'
        }
      ]
    }
    getCoversSummaryByOrganisationIdAndDateResult = [
      { name: 'Arable Land', area: 1000 },
      { name: 'Permanent Grassland', area: 2000 },
      { name: 'Permanent Crops', area: 3000 }
    ]
    getLandUseByBusinessParcelResult = [
      {
        start_date: '2015-09-16T09:50:01:000+0000',
        end_date: '2015-09-16T09:50:01:000+0000',
        dt_insert: '2015-09-16T09:50:01:000+0000',
        dt_delete: '2015-09-16T09:50:01:000+0000',
        campaign: 1,
        lu_code: 'mockCode',
        landuse: 'mockLanduse',
        area: 1000,
        length: null
      }
    ]

    dataSources = {
      ruralPaymentsBusiness: {
        getParcelsByOrganisationIdAndDate() {
          return getParcelsByOrganisationIdAndDateResult
        },
        getCoversByOrgSheetParcelIdDate() {
          return getCoversByOrgSheetParcelIdDateResult
        },
        getCoversSummaryByOrganisationIdAndDate() {
          return getCoversSummaryByOrganisationIdAndDateResult
        },
        getLandUseByBusinessParcel() {
          return getLandUseByBusinessParcelResult
        }
      }
    }
  })

  it('summary', () => {
    expect(BusinessLand.summary(mockBusiness, mockArguments)).toEqual({
      ...mockBusiness,
      ...mockArguments
    })
  })

  it('parcels', async () => {
    expect(await BusinessLand.parcels(mockBusiness, mockArguments, { dataSources })).toEqual([
      {
        id: 'mockId',
        sheetId: 'mockSheetId',
        area: 0.1,
        parcelId: 'mockParcelId',
        pendingDigitisation: false
      }
    ])
  })

  it('parcel', async () => {
    expect(
      await BusinessLand.parcel(
        mockBusiness,
        { ...mockArguments, sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources }
      )
    ).toEqual({
      organisationId: 'mockId',
      id: 'mockId',
      date: mockArguments.date,
      sheetId: 'mockSheetId',
      area: 0.1,
      parcelId: 'mockParcelId',
      pendingDigitisation: false
    })
  })

  it('parcelCovers', async () => {
    expect(
      await BusinessLand.parcelCovers(
        mockBusiness,
        { ...mockArguments, sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources }
      )
    ).toEqual([
      { id: '11033654', area: 0.1, name: 'Mock Name', code: 'someCode', isBpsEligible: true }
    ])
  })

  it('parcelLandUses - no length', async () => {
    expect(
      await BusinessLand.parcelLandUses(
        mockBusiness,
        { sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources }
      )
    ).toEqual([
      {
        code: 'mockCode',
        startDate: '2015-09-16T09:50:01.000Z',
        endDate: '2015-09-16T09:50:01.000Z',
        insertDate: '2015-09-16T09:50:01.000Z',
        deleteDate: '2015-09-16T09:50:01.000Z',
        area: 0.1,
        length: null,
        type: 'mockLanduse',
        campaign: 1
      }
    ])
  })

  it('parcelLandUses - no area', async () => {
    getLandUseByBusinessParcelResult[0].area = null
    getLandUseByBusinessParcelResult[0].length = 1000

    expect(
      await BusinessLand.parcelLandUses(
        mockBusiness,
        { sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources }
      )
    ).toEqual([
      {
        code: 'mockCode',
        startDate: '2015-09-16T09:50:01.000Z',
        endDate: '2015-09-16T09:50:01.000Z',
        insertDate: '2015-09-16T09:50:01.000Z',
        deleteDate: '2015-09-16T09:50:01.000Z',
        area: null,
        length: 1000,
        type: 'mockLanduse',
        campaign: 1
      }
    ])
  })

  describe('BusinessLandSummary', () => {
    it('totalParcels', async () => {
      expect(
        await BusinessLandSummary.totalParcels([{ id: 'mockId' }], null, {
          dataSources
        })
      ).toEqual(1)
    })

    it('totalArea', async () => {
      expect(
        await BusinessLandSummary.totalArea({ id: 'mockId' }, null, {
          dataSources
        })
      ).toEqual(0.1)
    })

    it('arableLandArea', async () => {
      expect(
        await BusinessLandSummary.arableLandArea({ id: 'mockId' }, null, {
          dataSources
        })
      ).toEqual(0.1)
    })

    it('permanentGrasslandArea', async () => {
      expect(
        await BusinessLandSummary.permanentGrasslandArea({ id: 'mockId' }, null, {
          dataSources
        })
      ).toEqual(0.2)
    })

    it('permanentCropsArea', async () => {
      expect(
        await BusinessLandSummary.permanentCropsArea({ id: 'mockId' }, null, {
          dataSources
        })
      ).toEqual(0.3)
    })
  })
})
