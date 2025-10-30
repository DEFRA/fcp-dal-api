import {
  BusinessLand,
  BusinessLandSummary
} from '../../../app/graphql/resolvers/business/business-land.js'

const dataSources = {
  ruralPaymentsPortalApi: {
    getParcelsSummaryByOrganisationId() {
      return {
        totalParcels: 1000,
        totalArea: 2000
      }
    }
  },
  ruralPaymentsBusiness: {
    getParcelsByOrganisationIdAndDate() {
      return [
        {
          id: 'mockId',
          parcelId: 'mockParcelId',
          sheetId: 'mockSheetId',
          area: 1000,
          pendingDigitisation: false
        }
      ]
    },
    getCoversByOrgSheetParcelIdDate() {
      return {
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
    },
    getCoversSummaryByOrganisationIdAndDate() {
      return [
        { name: 'Arable Land', area: 1000 },
        { name: 'Permanent Grassland', area: 2000 },
        { name: 'Permanent Crops', area: 3000 }
      ]
    },
    getLandUseByBusinessParcel() {
      return [
        {
          start_date: '2015-09-16T09:50:01:000+0000',
          end_date: '2015-09-16T09:50:01:000+0000',
          dt_insert: '2015-09-16T09:50:01:000+0000',
          dt_delete: '2015-09-16T09:50:01:000+0000',
          campaign: 1,
          lu_code: 'mockCode',
          landuse: 'mockLanduse',
          area: 0.1,
          length: 0.1
        }
      ]
    }
  }
}

const mockBusiness = { organisationId: 'mockId' }
const mockArguments = { date: '2022-01-01' }

describe('BusinessLand', () => {
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

  it('parcelLandUses', async () => {
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
        length: 0.1,
        type: 'mockLanduse',
        campaign: 1
      }
    ])
  })
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
