import { RuralPayments } from './RuralPayments.js'

export class RuralPaymentsReferenceData extends RuralPayments {
  async getCountryCodes() {
    return this.get('bank-change-service/v1/country-codes')
  }

  async getReferenceData(type) {
    return this.get(`reference/${type}`)
  }
}
