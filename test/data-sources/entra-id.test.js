import { DefaultAzureCredential } from '@azure/identity'
import { RESTDataSource } from '@apollo/datasource-rest'
import { jest } from '@jest/globals'
import { EntraIdApi } from '../../app/data-sources/entra-id/EntraIdApi.js'

const employeeId = 'test-id'
const userId = 'some-user-id'
const missingId = 'object-id-with-missing-employee-id'

describe('EntraGraphQL test - lookupEmployeeID', () => {
  beforeEach(() => {
    jest.spyOn(DefaultAzureCredential.prototype, 'getToken').mockImplementation(() => ({ token: 'mockToken' }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the employee ID from the user object ID', async () => {
    jest.spyOn(RESTDataSource.prototype, 'get').mockImplementation(() => ({ employeeId }))

    await new EntraIdApi().getEmployeeId(userId)

    expect(RESTDataSource.prototype.get).toHaveBeenCalledWith(
      'v1.0/users/some-user-id?$select=employeeId',
      { cacheOptions: { ttl: '10' }, headers: { Authorization: 'mockToken' } }
    )
  })

  it('returns the employee ID from the user object ID', async () => {
    jest.spyOn(RESTDataSource.prototype, 'get').mockImplementation(() => ({ employeeId }))

    expect(await new EntraIdApi().getEmployeeId(userId)).toEqual(employeeId)
  })

  it('should fail with an appropriate warning if the Entra ID record is missing the detail', async () => {
    jest.spyOn(RESTDataSource.prototype, 'get').mockImplementation(() => ({ employeeId: '' }))

    await expect(() => new EntraIdApi().getEmployeeId(missingId)).rejects.toEqual(
      new Error('Missing employee ID for user: ' + missingId)
    )
  })

  it('should fail if no credential flow is available', async () => {
    jest.spyOn(RESTDataSource.prototype, 'get').mockImplementation(() => { throw new Error() })

    await expect(() => new EntraIdApi().getEmployeeId(userId)).rejects.toEqual(
      new Error('Could not get the employee ID for the user: ' + userId)
    )
  })
})
