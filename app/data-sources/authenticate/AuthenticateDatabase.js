import Sequelize, { DataTypes } from 'sequelize'
import { logger } from '../../utils/logger.js'

const databaseName = process.env.AUTHENTICATE_DB_SCHEMA
const serverHost = process.env.AUTHENTICATE_DB_HOST

const readUsername = process.env.AUTHENTICATE_DB_USERNAME
const readPassword = process.env.AUTHENTICATE_DB_PASSWORD
const sequelizeRead = new Sequelize(databaseName, readUsername, readPassword, {
  host: serverHost,
  dialect: 'mssql',
  dialectOptions: { options: { encrypt: false } },
  logging: false
})

const auditWriteUsername = process.env.AUTHENTICATE_DB_USERNAME_AUDIT_WRITE
const auditWritePassword = process.env.AUTHENTICATE_DB_PASSWORD_AUDIT_WRITE
const sequelizeAuditWrite = new Sequelize(databaseName, auditWriteUsername, auditWritePassword, {
  host: serverHost,
  dialect: 'mssql',
  dialectOptions: { options: { encrypt: false } },
  logging: false
})

const Answer = sequelizeRead.define('Answers', {
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

export class AuthenticateDatabase {
  async getAuthenticateQuestionsAnswersByCRN (crn, employeeId) {
    await sequelizeAuditWrite.query(`
      INSERT INTO Audits ([Date], [User], [Action], [Value])
      VALUES(?, ?, ?, ?); 
    `, {
      replacements: [new Date().toISOString(), employeeId, 'Search', crn]
    })

    const answers = await Answer.findOne({
      attributes: ['CRN', 'Date', 'Event', 'Location', 'Updated'],
      where: {
        CRN: crn
      }
    })

    logger.info(`getAuthenticateQuestionsAnswersByCRN: got answers for ${crn}`)
    return answers
  }
}
