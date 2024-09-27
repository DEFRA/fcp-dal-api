import { RESTDataSource } from '@apollo/datasource-rest'
import { DefaultAzureCredential } from '@azure/identity'
import { ENTRA_REQUEST_EMPLOYEE_LOOKUP_001 } from '../../logger/codes.js'

const credential = new DefaultAzureCredential()

export class EntraIdApi extends RESTDataSource {
  baseURL = process.env.ENTRA_ID_URL

  async getEmployeeId (entraIdUserObjectId) {
    let employeeId
    let requestTimeMs
    try {
      const requestStart = Date.now()
      const { token } = await credential.getToken(`${this.baseURL}/.default`)

      const response = await this.get(
        `v1.0/users/${entraIdUserObjectId}?$select=employeeId`,
        {
          headers: {
            Authorization: token
          },
          cacheOptions: {
            ttl: process.env.ENTRA_ID_TTL_IN_SECONDS
          }
        }
      )
      requestTimeMs = (Date.now() - requestStart)
      employeeId = response.employeeId
    } catch (error) {
      this.logger.error('Could not get the employee ID for the user', { entraIdUserObjectId, error, code: ENTRA_REQUEST_EMPLOYEE_LOOKUP_001 })
      throw new Error(`Could not get the employee ID for the user: ${entraIdUserObjectId}`)
    }

    if (!employeeId) {
      this.logger.error('Missing employee ID for user', { entraIdUserObjectId, code: ENTRA_REQUEST_EMPLOYEE_LOOKUP_001 })
      throw new Error(`Missing employee ID for user: ${entraIdUserObjectId}`)
    }

    this.logger.health('Successful get employee ID for user', { code: ENTRA_REQUEST_EMPLOYEE_LOOKUP_001, requestTimeMs })

    return employeeId
  }
}
