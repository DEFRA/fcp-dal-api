function calculateOnHoldStatus(holdCodes) {
  if (!holdCodes || holdCodes.length === 0) {
    return false
  }

  if (holdCodes.includes('NTHLD')) {
    return false
  }

  return true
}

function transformPayment(payment) {
  return {
    reference: payment.parmPaymentReference,
    date: payment.parmDate.split('T')[0], // Convert to YYYY-MM-DD
    amount: payment.parmAmount,
    currency: payment.parmCurrency,
    lineItems: payment.parmLineItems.map(transformLineItem)
  }
}

function transformLineItem(lineItem) {
  return {
    agreementClaimNo: `${lineItem.parmAgreementNumber}/${lineItem.parmClaimRefNumber}`,
    scheme: lineItem.parmScheme,
    marketingYear: lineItem.parmMarketingYear,
    description: lineItem.parmDescription,
    amount: lineItem.parmAmount
  }
}

export function transformBusinessPayments(hitachiResponse) {
  const { parmSupplierInfo, parmPayments } = hitachiResponse

  // Calculate onHold status
  const onHold = calculateOnHoldStatus(parmSupplierInfo?.parmHoldCodes)

  // Transform payments with date sorting (earliest first)
  const payments = (parmPayments || [])
    .map(transformPayment)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  return { onHold, payments }
}
