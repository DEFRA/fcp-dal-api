import { DataTypes, Sequelize } from 'sequelize'
import { AUTHENTICATE_DATABASE_READ_001, AUTHENTICATE_DATABASE_WRITE_001, AUTHENTICATE_DATABASE_WRITE_002 } from '../../logger/codes.js'

const dbOptions = {
  database: process.env.AUTHENTICATE_DB_SCHEMA,
  host: process.env.AUTHENTICATE_DB_HOST,
  dialect: 'mssql',
  dialectOptions: { options: { encrypt: false } },
  logging: false
}

export class AuthenticateDatabase {
  logger = null

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

  constructor (config = {}) {
    this.logger = config.logger
  }

  async healthCheck () {
    try {
      this.logger.verbose('#datasource - authenticate - checking database connection', { code: AUTHENTICATE_DATABASE_READ_001 })
      await this.dbRead.authenticate()
      this.logger.debug('#datasource - authenticate - database connection established', { code: AUTHENTICATE_DATABASE_READ_001 })
    } catch (error) {
      this.logger.error('#datasource - authenticate - connection error', { error, code: AUTHENTICATE_DATABASE_READ_001 })
      throw error
    }
  }

  async getAuthenticateQuestionsAnswersByCRN (crn, employeeId) {
    try {
      this.logger.verbose('#datasource - authenticate - Creating audit record in authenticate database', { employeeId, crn, code: AUTHENTICATE_DATABASE_WRITE_001 })
      const requestStart = Date.now()
      await this.dbAuditWrite.query(`
      INSERT INTO Audits ([Date], [User], [Action], [Value])
      VALUES(?, ?, ?, ?);
    `, {
        replacements: [new Date().toISOString(), employeeId, 'Search', crn]
      })
      const requestTimeMs = (Date.now() - requestStart)
      this.logger.debug('#datasource - authenticate - Created audit record in authenticate database', { employeeId, crn, code: AUTHENTICATE_DATABASE_WRITE_001, requestTimeMs })
    } catch (error) {
      this.logger.error('#datasource - authenticate - Authenticate database error', { error, code: AUTHENTICATE_DATABASE_WRITE_001 })
      throw error
    }

    try {
      this.logger.verbose('#datasource - authenticate - Getting authenticate questions answers by CRN', { crn, employeeId, code: AUTHENTICATE_DATABASE_WRITE_002 })
      const requestStart = Date.now()
      const answers = await this.Answer.findOne({
        attributes: ['CRN', 'Date', 'Event', 'Location', 'Updated'],
        where: {
          CRN: crn
        }
      })
      const requestTimeMs = (Date.now() - requestStart)
      this.logger.debug('#datasource - authenticate - Got authenticate questions answers by CRN', { crn, answers, code: AUTHENTICATE_DATABASE_WRITE_002, requestTimeMs })
      return answers
    } catch (error) {
      this.logger.error('#datasource - authenticate - Authenticate database error', { error, code: AUTHENTICATE_DATABASE_WRITE_002 })
      throw error
    }
  }
}
