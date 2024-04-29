import Sequelize, { DataTypes } from 'sequelize'

export class AuthenticateDatabase {
  async getConnection () {
    const serverUsername = process.env.AUTHENTICATE_DB_USERNAME
    const serverPassword = process.env.AUTHENTICATE_DB_PASSWORD
    const serverHost = process.env.AUTHENTICATE_DB_HOST
    const databaseName = process.env.AUTHENTICATE_DB_SCHEMA

    return new Sequelize(databaseName, serverUsername, serverPassword, {
      host: serverHost,
      dialect: 'mssql',
      dialectOptions: {
        options: {
          encrypt: false
        }
      }
    })
  }

  async getAuthenticateQuestionsAnswersByCRN (crn) {
    const connection = await this.getConnection()

    const Answer = connection.define('Answers', {
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

    const answers = await Answer.findOne({
      attributes: ['CRN', 'Date', 'Event', 'Location'],
      where: {
        CRN: crn
      }
    })

    return answers
  }
}
