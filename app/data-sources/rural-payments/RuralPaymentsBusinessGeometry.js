import { RuralPayments } from './RuralPayments.js'
import { formatDateDDMMMYY } from '../../utils/date.js'
import { logger } from '../../logger/logger.js'

/**
 * Due to the potentially large response payloads, combined with the large number of concurrent
 * datasource requests, we need to override the cloneParsedBody function for geometries.  This
 * avoids creating a deep clone for each request.
 *
 * To limit the scope to just the geometry retrieval, this function has been pulled out into its own
 * data source .
 */
export class RuralPaymentsBusinessGeometry extends RuralPayments {
  getGeometriesByOrganisationIdAndDate(organisationId, date) {
    const formattedDate = formatDateDDMMMYY(new Date(date))

    const geom = this.get(
      `lms/organisation/${organisationId}/geometries?bbox=0,0,0,0&historicDate=${formattedDate}`
    )
    logger.info('Retrieved geometries')
    return geom
  }

  /**
   * Avoid deep cloning cached responses by simply returning the body as-is.
   */
  cloneParsedBody(parsedBody) {
    // logger.info('Cloning parsed body')
    return Object.freeze(parsedBody)
  }
}
