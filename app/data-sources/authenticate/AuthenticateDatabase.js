import { Sequelize, DataTypes } from 'sequelize'
import { logger } from '../../utils/logger.js'

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

  async getAuthenticateQuestionsAnswersByCRN (crn, employeeId) {
    await this.dbAuditWrite.query(`
      INSERT INTO Audits ([Date], [User], [Action], [Value])
      VALUES(?, ?, ?, ?);
    `, {
      replacements: [new Date().toISOString(), employeeId, 'Search', crn]
    })

    const answers = await this.Answer.findOne({
      attributes: ['CRN', 'Date', 'Event', 'Location', 'Updated'],
      where: {
        CRN: crn
      }
    })

    logger.info(`getAuthenticateQuestionsAnswersByCRN: got answers for ${crn}`)
    return answers
  }
}
