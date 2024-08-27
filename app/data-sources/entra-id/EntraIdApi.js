import { RESTDataSource } from '@apollo/datasource-rest'
import { DefaultAzureCredential } from '@azure/identity'

const credential = new DefaultAzureCredential()

export class EntraIdApi extends RESTDataSource {
  baseURL = process.env.ENTRA_ID_URL

  async getEmployeeId (entraIdUserObjectId) {
    let employeeId

    try {
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

      employeeId = response.employeeId
    } catch (err) {
      this.logger.error(err)
      throw new Error(`Could not get the employee ID for the user: ${entraIdUserObjectId}`)
    }

    if (!employeeId) {
      throw new Error(`Missing employee ID for user: ${entraIdUserObjectId}`)
    }

    return employeeId
  }
}
