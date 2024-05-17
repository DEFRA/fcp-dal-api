import { BusinessLand, BusinessLandSummary } from '../../app/graphql/resolvers/business/business-land.js'

const dataSources = {
  ruralPaymentsPortalApi: {
    getParcelsByOrganisationId () {
      return [{ id: 'mockId', sheetId: 'mockSheetId', area: 1000 }]
    },
    getCoversByOrganisationId () {
      return [{ id: 'mockId', info: [{ area: 1000, name: 'Mock Name' }] }]
    },
    getParcelsSummaryByOrganisationId () {
      return {
        totalParcels: 1000,
        totalArea: 2000
      }
    },
    getCoversSummaryByOrganisationId () {
      return [
        { name: 'Arable Land', area: 1000 },
        { name: 'Permanent Grassland', area: 2000 },
        { name: 'Permanent Crops', area: 3000 }
      ]
    }
  }
}

const mockBusiness = { businessId: 'mockId' }

describe('BusinessLand', () => {
  it('summary', () => {
    expect(BusinessLand.summary(mockBusiness)).toEqual(mockBusiness)
  })

  it('parcels', async () => {
    expect(await BusinessLand.parcels(mockBusiness, null, { dataSources })).toEqual([{ id: 'mockId', sheetId: 'mockSheetId', area: 1000 }])
  })

  it('covers', async () => {
    expect(await BusinessLand.covers(mockBusiness, null, { dataSources })).toEqual([{ id: 'mockId', area: 1000, name: 'MOCK_NAME' }])
  })
})

describe('BusinessLandSummary', () => {
  it('totalParcels', async () => {
    expect(await BusinessLandSummary.totalParcels({ id: 'mockId' }, null, { dataSources })).toEqual(1000)
  })

  it('totalArea', async () => {
    expect(await BusinessLandSummary.totalArea({ id: 'mockId' }, null, { dataSources })).toEqual(2000)
  })

  it('arableLandArea', async () => {
    expect(await BusinessLandSummary.arableLandArea({ id: 'mockId' }, null, { dataSources })).toEqual(1000)
  })

  it('permanentGrasslandArea', async () => {
    expect(await BusinessLandSummary.permanentGrasslandArea({ id: 'mockId' }, null, { dataSources })).toEqual(2000)
  })

  it('permanentCropsArea', async () => {
    expect(await BusinessLandSummary.permanentCropsArea({ id: 'mockId' }, null, { dataSources })).toEqual(3000)
  })
})
