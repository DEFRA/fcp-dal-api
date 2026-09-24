import { expect, jest } from '@jest/globals'

const runRuralPaymentsCheckMock = jest.fn()
const runCurlGatewayCheckMock = jest.fn()

jest.unstable_mockModule(
  '../../../../../app/utils/health/rural-payments/datasource-check.js',
  () => ({
    runRuralPaymentsCheck: runRuralPaymentsCheckMock
  })
)
jest.unstable_mockModule('../../../../../app/utils/health/rural-payments/curl-check.js', () => ({
  runCurlGatewayCheck: runCurlGatewayCheckMock
}))

const { healthCheck } =
  await import('../../../../../app/utils/health/rural-payments/rural-payments.js')

describe('Rural payments health check', () => {
  beforeEach(() => {
    runRuralPaymentsCheckMock.mockResolvedValue()
    runCurlGatewayCheckMock.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should run the datasource and curl checks for both internal and external gateways', async () => {
    await expect(healthCheck()).resolves.toBeUndefined()

    expect(runRuralPaymentsCheckMock).toHaveBeenCalledTimes(2)
    expect(runRuralPaymentsCheckMock).toHaveBeenCalledWith('internal')
    expect(runRuralPaymentsCheckMock).toHaveBeenCalledWith('external')
    expect(runCurlGatewayCheckMock).toHaveBeenCalledTimes(2)
    expect(runCurlGatewayCheckMock).toHaveBeenCalledWith('internal')
    expect(runCurlGatewayCheckMock).toHaveBeenCalledWith('external')
  })

  it('should throw when a datasource check fails', async () => {
    runRuralPaymentsCheckMock.mockRejectedValueOnce(new Error('Rural payments connection failed'))

    await expect(healthCheck()).rejects.toThrow('Rural payments connection failed')
  })
})
