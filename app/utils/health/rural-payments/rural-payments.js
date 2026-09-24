import { runCurlGatewayCheck } from './curl-check.js'
import { runRuralPaymentsCheck } from './datasource-check.js'

/** Check that both internal and external Rural Payments endpoints are available */
export const healthCheck = async () => {
  await Promise.all([
    runRuralPaymentsCheck('internal'),
    runRuralPaymentsCheck('external'),
    runCurlGatewayCheck('internal'),
    runCurlGatewayCheck('external')
  ])
}
