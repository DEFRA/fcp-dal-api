import { deepEqual } from 'assert'

import {
  transformRuralPaymentsAgencyLandAPILandCovers,
  transformRuralPaymentsAgencyLandAPILandParcels,
  transformRuralPaymentsAgencyLandAPILandParcelsToSummary
} from '../../app/transformers/rural-payments-agency-land-api.js'

const mockLandCoversResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'LandCovers.5426656',
      properties: {
        index: 5426656,
        ID: '11033654',
        SHEET_ID: 'SO5196',
        PARCEL_ID: '4551',
        VALID_FROM: '20220412000002',
        VALID_TO: '99991231000000',
        REFERENCE_PARCELS_ID: '7154931',
        LAND_COVER_CLASS_CODE: '130',
        DESCRIPTION: 'Permanent Grassland',
        CREATED_ON: '20220617063619',
        AREA_HA: '3.1161916585340657',
        SBI: '807294898',
        SHAPE_AREA: 31161.916585340656,
        SHAPE_PERIMETER: 806.19230658754
      },
      bbox: [351348.8098, 296391.839, 351533.03, 296688.5099]
    },
    {
      type: 'Feature',
      id: 'LandCovers.5936159',
      properties: {
        index: 5936159,
        ID: '10409591',
        SHEET_ID: 'SO5196',
        PARCEL_ID: '4638',
        VALID_FROM: '20210513000002',
        VALID_TO: '99991231000000',
        REFERENCE_PARCELS_ID: '6953379',
        LAND_COVER_CLASS_CODE: '131',
        DESCRIPTION: 'Permanent Grassland',
        CREATED_ON: '20210605093436',
        AREA_HA: '0.5409713521247209',
        SBI: '807294898',
        SHAPE_AREA: 5409.713521247209,
        SHAPE_PERIMETER: 338.5946224840174
      },
      bbox: [351399.08, 296352.4399, 351532.3643, 296419.21]
    }
  ],
  totalFeatures: 2,
  numberMatched: 2,
  numberReturned: 2,
  timeStamp: '2023-11-20T21:36:25.275Z',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:EPSG::27700'
    }
  },
  bbox: [351348.8098, 296352.4399, 351533.03, 296688.5099]
}

const mockLandParcelsResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'LandParcels.645998',

      properties: {
        index: 645998,
        ID: '7154931',
        SHEET_ID: 'SO5196',
        PARCEL_ID: '4551',
        VALID_FROM: '20220412000002',
        VALID_TO: '99991231000000',
        LFA_CODE: 'N',
        CREATED_ON: '20220617063619',
        AREA_HA: '3.1161916585340657',
        SBI: '807294898',
        SHAPE_AREA: 31161.916585340656,
        SHAPE_PERIMETER: 806.19230658754
      },
      bbox: [351348.8098, 296391.839, 351533.03, 296688.5099]
    },
    {
      type: 'Feature',
      id: 'LandParcels.1636446',
      properties: {
        index: 1636446,
        ID: '6953379',
        SHEET_ID: 'SO5196',
        PARCEL_ID: '4638',
        VALID_FROM: '20210513000002',
        VALID_TO: '99991231000000',
        LFA_CODE: 'N',
        CREATED_ON: '20210605093436',
        AREA_HA: '0.5409713521247209',
        SBI: '807294898',
        SHAPE_AREA: 5409.713521247209,
        SHAPE_PERIMETER: 338.5946224840174
      },
      bbox: [351399.08, 296352.4399, 351532.3643, 296419.21]
    }
  ],
  totalFeatures: 2,
  numberMatched: 2,
  numberReturned: 2,
  timeStamp: '2023-11-20T21:42:45.833Z',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:EPSG::27700'
    }
  },
  bbox: [351348.8098, 296352.4399, 351533.03, 296688.5099]
}

describe('transformRuralPaymentsAgencyLandAPILandCovers', () => {
  it('should transform data', () => {
    const result = transformRuralPaymentsAgencyLandAPILandCovers(
      '6953379',
      mockLandCoversResponse
    )

    deepEqual(result, [
      {
        id: '10409591',
        classCode: '131',
        description: 'PERMANENT_GRASSLAND',
        area: '0.5409713521247209'
      }
    ])
  })
})

describe('transformRuralPaymentsAgencyLandAPILandParcels', () => {
  it('should transform data', () => {
    const result = transformRuralPaymentsAgencyLandAPILandParcels(
      'sbi',
      mockLandParcelsResponse
    )

    deepEqual(result, [
      { sbi: 'sbi', id: '7154931', area: '3.1161916585340657' },
      { sbi: 'sbi', id: '6953379', area: '0.5409713521247209' }
    ])
  })
})

describe('transformRuralPaymentsAgencyLandAPILandParcelsToSummary', () => {
  it('should transform data', () => {
    const result = transformRuralPaymentsAgencyLandAPILandParcelsToSummary(
      mockLandParcelsResponse
    )

    deepEqual(result, { numberOfParcels: 2, totalArea: 3.6571630106587865 })
  })
})
