import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BusinessLand,
  BusinessLandParcel,
  BusinessLandSummary
} from '../../../../app/graphql/resolvers/business/business-land.js'

const infoSelecting = (...fieldNames) => ({
  fieldNodes: [
    {
      selectionSet: {
        selections: fieldNames.map((value) => ({ kind: 'Field', name: { value } }))
      }
    }
  ]
})

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
        getCoversByOrgSheetParcelIdDate: vi.fn(async () => getCoversByOrgSheetParcelIdDateResult),
        getParcelGeometryMapByOrganisationIdAndDate: vi.fn(async () => new Map()),
        getCoversSummaryByOrganisationIdAndDate() {
          return getCoversSummaryByOrganisationIdAndDateResult
        },
        getLandUseByBusinessParcel() {
          return getLandUseByBusinessParcelResult
        },
        getParcelGeometriesByOrganisationIdAndDate: vi.fn(async () => ({
          features: [
            {
              id: 1,
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [] },
              properties: {
                sheetId: 'mockSheetId',
                parcelId: 'mockParcelId',
                area: '1000',
                pendingDigitisation: 'false'
              }
            }
          ]
        }))
      },
      serviceAccount: {
        ruralPaymentsBusiness: null
      }
    }
  })

  it('summary', () => {
    expect(BusinessLand.summary(mockBusiness, mockArguments, {})).toEqual({
      ...mockBusiness,
      ...mockArguments
    })
  })

  it('parcels', async () => {
    expect(await BusinessLand.parcels(mockBusiness, mockArguments, { dataSources })).toEqual([
      {
        organisationId: 'mockId',
        date: mockArguments.date,
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
      {
        id: '11033654',
        area: 0.1,
        name: 'Mock Name',
        code: 'someCode',
        isBpsEligible: true,
        geometry: null
      }
    ])
    expect(dataSources.ruralPaymentsBusiness.getCoversByOrgSheetParcelIdDate).toHaveBeenCalledWith(
      'mockId',
      'mockSheetId',
      'mockParcelId',
      mockArguments.date,
      false
    )
  })

  it('parcelCovers requests cover geometries when geometry is selected', async () => {
    await BusinessLand.parcelCovers(
      mockBusiness,
      { ...mockArguments, sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
      { dataSources },
      infoSelecting('id', 'geometry')
    )

    expect(dataSources.ruralPaymentsBusiness.getCoversByOrgSheetParcelIdDate).toHaveBeenCalledWith(
      'mockId',
      'mockSheetId',
      'mockParcelId',
      mockArguments.date,
      true
    )
    // Cover geometry must not trigger a fetch of the organisation's parcel geometries
    expect(
      dataSources.ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate
    ).not.toHaveBeenCalled()
  })

  describe('parcel geometry prefetch', () => {
    it('parcels starts fetching geometries when geometry is selected', async () => {
      await BusinessLand.parcels(
        mockBusiness,
        mockArguments,
        { dataSources },
        infoSelecting('id', 'geometry')
      )

      expect(
        dataSources.ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate
      ).toHaveBeenCalledWith('mockId', mockArguments.date)
    })

    it('parcels does not fetch geometries when geometry is not selected', async () => {
      await BusinessLand.parcels(mockBusiness, mockArguments, { dataSources }, infoSelecting('id'))

      expect(
        dataSources.ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate
      ).not.toHaveBeenCalled()
    })

    it('parcel starts fetching geometries when geometry is selected', async () => {
      await BusinessLand.parcel(
        mockBusiness,
        { ...mockArguments, sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources },
        infoSelecting('geometry')
      )

      expect(
        dataSources.ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate
      ).toHaveBeenCalledWith('mockId', mockArguments.date)
    })

    it('a failed prefetch does not cause an unhandled rejection when parcels fails', async () => {
      const { ruralPaymentsBusiness } = dataSources
      ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate.mockRejectedValue(
        new Error('geometries failed')
      )
      dataSources.ruralPaymentsBusiness.getParcelsByOrganisationIdAndDate = vi.fn(async () => {
        throw new Error('parcels failed')
      })

      await expect(
        BusinessLand.parcels(
          mockBusiness,
          mockArguments,
          { dataSources },
          infoSelecting('geometry')
        )
      ).rejects.toThrow('parcels failed')
    })
  })

  it('geometries', async () => {
    expect(await BusinessLand.geometries(mockBusiness, mockArguments, { dataSources })).toEqual([
      {
        id: '1',
        sheetId: 'mockSheetId',
        parcelId: 'mockParcelId',
        area: 0.1,
        pendingDigitisation: false,
        geometry: { type: 'Polygon', coordinates: [] }
      }
    ])
    expect(
      dataSources.ruralPaymentsBusiness.getParcelGeometriesByOrganisationIdAndDate
    ).toHaveBeenCalledWith('mockId', mockArguments.date)
  })

  it('geometries defaults to the current date', async () => {
    await BusinessLand.geometries(mockBusiness, {}, { dataSources })

    expect(
      dataSources.ruralPaymentsBusiness.getParcelGeometriesByOrganisationIdAndDate
    ).toHaveBeenCalledWith('mockId', expect.any(Date))
  })

  it('geometries records a parcel-geometries entity keyed by sbi', async () => {
    const auditTrail = { recordEntity: vi.fn() }
    const info = { path: { key: 'geometries' } }

    await BusinessLand.geometries(
      { ...mockBusiness, sbi: 'mockSbi' },
      {},
      { dataSources, auditTrail },
      info
    )

    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'parcel-geometries',
      action: 'read',
      entityid: 'mockSbi'
    })
  })

  it('parcelLandUses - no length', async () => {
    expect(
      await BusinessLand.parcelLandUses(
        mockBusiness,
        { date: '2025-05-04', sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
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
        { date: '2025-05-04', sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
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

  describe('audit trail', () => {
    const info = { path: { key: 'business', typename: 'Query', prev: undefined } }

    it('summary records a land-summary entity keyed by sbi', () => {
      const auditTrail = { recordEntity: vi.fn() }

      BusinessLand.summary({ ...mockBusiness, sbi: 'mockSbi' }, mockArguments, { auditTrail }, info)

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'land-summary',
        action: 'read',
        entityid: 'mockSbi'
      })
    })

    it('parcel records a parcel entity keyed by sheetId-parcelId', async () => {
      const auditTrail = { recordEntity: vi.fn() }

      await BusinessLand.parcel(
        { ...mockBusiness, sbi: 'mockSbi' },
        { ...mockArguments, sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'parcel',
        action: 'read',
        entityid: 'mockSheetId-mockParcelId'
      })
    })

    it('parcels records a parcel-list entity keyed by sbi', async () => {
      const auditTrail = { recordEntity: vi.fn() }

      await BusinessLand.parcels(
        { ...mockBusiness, sbi: 'mockSbi' },
        mockArguments,
        { dataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'parcel-list',
        action: 'read',
        entityid: 'mockSbi'
      })
    })

    it('parcelCovers records a land-cover-list entity keyed by sheetId-parcelId', async () => {
      const auditTrail = { recordEntity: vi.fn() }

      await BusinessLand.parcelCovers(
        mockBusiness,
        { ...mockArguments, sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'land-cover-list',
        action: 'read',
        entityid: 'mockSheetId-mockParcelId'
      })
    })

    it('parcelLandUses records a land-use-list entity keyed by sheetId-parcelId', async () => {
      const auditTrail = { recordEntity: vi.fn() }

      await BusinessLand.parcelLandUses(
        { sbi: 'mockSbi' },
        { date: '2025-05-04', sheetId: 'mockSheetId', parcelId: 'mockParcelId' },
        { dataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'land-use-list',
        action: 'read',
        entityid: 'mockSheetId-mockParcelId'
      })
    })

    it('does not throw when no audit trail is supplied', async () => {
      await BusinessLand.parcels({ ...mockBusiness, sbi: 'mockSbi' }, mockArguments, {
        dataSources
      })
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
})

describe('BusinessLandParcel', () => {
  describe('geometry', () => {
    const polygon = { type: 'Polygon', coordinates: [[[0, 0]]] }
    const date = '2024-03-19'
    let dataSources

    beforeEach(() => {
      dataSources = {
        ruralPaymentsBusiness: {
          getParcelGeometryMapByOrganisationIdAndDate: vi.fn(
            async () => new Map([['SX1234:5678', polygon]])
          )
        }
      }
    })

    it('returns the geometry matching the parcel sheet and parcel id for the date', async () => {
      expect(
        await BusinessLandParcel.geometry(
          { id: '123', organisationId: 'orgId', date, sheetId: 'SX1234', parcelId: '5678' },
          {},
          { dataSources }
        )
      ).toEqual(polygon)
      expect(
        dataSources.ruralPaymentsBusiness.getParcelGeometryMapByOrganisationIdAndDate
      ).toHaveBeenCalledWith('orgId', date)
    })

    it('returns null when there is no geometry for the parcel', async () => {
      expect(
        await BusinessLandParcel.geometry(
          { id: '123', organisationId: 'orgId', date, sheetId: 'SX1234', parcelId: '9999' },
          {},
          { dataSources }
        )
      ).toBeNull()
    })
  })
})
