import { DataTypes, Sequelize } from 'sequelize'
import { AUTHENTICATE_DATABASE_ALL_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

const dbOptions = {
  database: process.env.AUTHENTICATE_DB_SCHEMA,
  host: process.env.AUTHENTICATE_DB_HOST,
  dialect: 'mssql',
  dialectOptions: { options: { encrypt: false } },
  logging: false
}

export class AuthenticateDatabase {
  dbRead = new Sequelize({
    ...dbOptions,
    username: process.env.AUTHENTICATE_DB_USERNAME,
    password: process.env.AUTHENTICATE_DB_PASSWORD
  })

  dbAuditWrite = new Sequelize({
    ...dbOptions,
    username: process.env.AUTHENTICATE_DB_USERNAME_AUDIT_WRITE,
    password: process.env.AUTHENTICATE_DB_PASSWORD_AUDIT_WRITE
  })

  Answer = this.dbRead.define('Answers', {
    CRN: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    Date: DataTypes.STRING,
    Event: DataTypes.STRING,
    Location: DataTypes.STRING,
    UpdatedBy: DataTypes.STRING,
    Updated: DataTypes.DATE
  })

  async healthCheck () {
    try {
      await this.dbRead.authenticate()
      logger.health('#authenticate - database authenticated', { code: AUTHENTICATE_DATABASE_ALL_001 })
    } catch (error) {
      logger.error('Authenticate database error', { error, code: AUTHENTICATE_DATABASE_ALL_001 })
      throw error
    }
  }

  async getAuthenticateQuestionsAnswersByCRN (crn, employeeId) {
    try {
      logger.silly('Creating audit record in authenticate database', { employeeId, crn })
      const requestStart = Date.now()
      await this.dbAuditWrite.query(`
      INSERT INTO Audits ([Date], [User], [Action], [Value])
      VALUES(?, ?, ?, ?);
    `, {
        replacements: [new Date().toISOString(), employeeId, 'Search', crn]
      })
      logger.debug('Created audit record in authenticate database', { employeeId, crn })

      logger.silly('Getting authenticate questions answers by CRN', { crn, employeeId })
      const answers = await this.Answer.findOne({
        attributes: ['CRN', 'Date', 'Event', 'Location', 'Updated'],
        where: {
          CRN: crn
        }
      })
      const requestTimeMs = (Date.now() - requestStart)
      logger.debug('Got authenticate questions answers by CRN', { crn, answers })

      logger.health('#authenticate - answers retrieved', { code: AUTHENTICATE_DATABASE_ALL_001, requestTimeMs })
      return answers
    } catch (error) {
      logger.error('Authenticate database error', { error, code: AUTHENTICATE_DATABASE_ALL_001 })
      throw error
    }
  }
}
