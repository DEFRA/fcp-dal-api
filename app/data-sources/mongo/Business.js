import { MongoDataSource } from 'apollo-datasource-mongodb'
import { MONGO_DB_ERROR_001 } from '../../logger/codes.js'

/**
 * Cache of SBI → orgId / FRN mappings. A Mongo failure never fails the request: a failed read is
 * logged and treated as a cache miss (so the caller falls back to upstream), and a failed write is
 * logged and skipped.
 */
export class MongoBusiness extends MongoDataSource {
  constructor({ logger, ...options }) {
    super(options)
    this.logger = logger
  }

  async getOrgIdBySbi(sbi) {
    try {
      const org = await this.collection.findOne({ _id: sbi })
      return org?.orgId
    } catch (error) {
      this.logger.warn('#datasource - MongoBusiness - failed to read orgId from MongoDB', {
        sbi,
        code: MONGO_DB_ERROR_001,
        error
      })
      return undefined
    }
  }

  async getFrnBySbi(sbi) {
    try {
      const org = await this.collection.findOne({ _id: sbi })
      return org?.frn
    } catch (error) {
      this.logger.warn('#datasource - MongoBusiness - failed to read frn from MongoDB', {
        sbi,
        code: MONGO_DB_ERROR_001,
        error
      })
      return undefined
    }
  }

  /**
   * Caches the orgId and/or FRN for an SBI. Only the known mapping fields are written, and empty
   * values are skipped, so a partial mapping never clears a value already cached for the SBI.
   * @param {string} sbi the business's SBI (the document _id)
   * @param {{ orgId?: string|number, frn?: string }} mappings the values to cache
   * @returns {Promise<object|undefined>} the update result, or undefined when there was nothing to
   *   write (so an existing document's TTL is not refreshed) or the write failed
   */
  async upsertMappingBySbi(sbi, mappings) {
    const kvps = {
      ...(mappings?.orgId ? { orgId: mappings.orgId } : {}),
      ...(mappings?.frn ? { frn: mappings.frn } : {})
    }
    if (Object.keys(kvps).length === 0) {
      return undefined
    }

    const now = new Date()
    try {
      // awaited, so a rejected write is caught here rather than returned to the caller
      return await this.collection.updateOne(
        { _id: sbi },
        {
          $set: { ...kvps, updatedAt: now },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      )
    } catch (error) {
      this.logger.warn('#datasource - MongoBusiness - failed to store mapping in MongoDB', {
        sbi,
        code: MONGO_DB_ERROR_001,
        error
      })
      return undefined
    }
  }
}
