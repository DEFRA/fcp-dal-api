import { RuralPayments } from './RuralPayments.js'

// TODO This is a placeholder until ref data is delivered
export class RuralPaymentsReference extends RuralPayments {
  async legalStatus() {
    const response = await this.get(`reference/legalstatus`)
    return response._data
  }
}
