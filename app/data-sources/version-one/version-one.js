import { RESTDataSource } from '@apollo/datasource-rest'

export class VersionOne extends RESTDataSource {
  baseURL = process.env.VERSION_ONE_API_URL
}
