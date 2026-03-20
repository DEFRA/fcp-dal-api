import { transformBusinessPayments } from '../../../../app/transformers/hitachi/payments.js'

describe('transformBusinessPayments', () => {
  test('should return placeholder data when no data provided', () => {
    const result = transformBusinessPayments({})
    expect(result).toEqual({
      onHold: false,
      payments: []
    })
  })

  test('should transform payments data correctly', () => {
    const hitachiResponse = {
      parmSupplierInfo: {
        parmHoldCodes: []
      },
      parmPayments: [
        {
          parmPaymentReference: 'PAY001',
          parmDate: '2023-06-15T10:30:00Z',
          parmAmount: 1500.5,
          parmCurrency: 'GBP',
          parmLineItems: [
            {
              parmAgreementNumber: 'AGR123',
              parmClaimRefNumber: 'CLAIM001',
              parmScheme: 'BPS',
              parmMarketingYear: '2023',
              parmDescription: 'Basic Payment Scheme',
              parmAmount: 1500.5
            }
          ]
        },
        {
          parmPaymentReference: 'PAY002',
          parmDate: '2023-05-10T14:20:00Z',
          parmAmount: 750.25,
          parmCurrency: 'GBP',
          parmLineItems: [
            {
              parmAgreementNumber: 'AGR456',
              parmClaimRefNumber: 'CLAIM002',
              parmScheme: 'SFI',
              parmMarketingYear: '2023',
              parmDescription: 'Sustainable Farming Incentive',
              parmAmount: 750.25
            }
          ]
        }
      ]
    }

    const result = transformBusinessPayments(hitachiResponse)

    expect(result).toEqual({
      onHold: false,
      payments: [
        {
          reference: 'PAY002',
          date: '2023-05-10',
          amount: 750.25,
          currency: 'GBP',
          lineItems: [
            {
              agreementClaimNo: 'AGR456/CLAIM002',
              scheme: 'SFI',
              marketingYear: '2023',
              description: 'Sustainable Farming Incentive',
              amount: 750.25
            }
          ]
        },
        {
          reference: 'PAY001',
          date: '2023-06-15',
          amount: 1500.5,
          currency: 'GBP',
          lineItems: [
            {
              agreementClaimNo: 'AGR123/CLAIM001',
              scheme: 'BPS',
              marketingYear: '2023',
              description: 'Basic Payment Scheme',
              amount: 1500.5
            }
          ]
        }
      ]
    })
  })

  test('should handle onHold status correctly', () => {
    const testCases = [
      { holdCodes: [], expected: false },
      { holdCodes: ['NTHLD'], expected: false },
      { holdCodes: ['HOLD1'], expected: true },
      { holdCodes: ['NTHLD', 'HOLD1'], expected: false },
      { holdCodes: ['HOLD1', 'HOLD2'], expected: true }
    ]

    testCases.forEach(({ holdCodes, expected }) => {
      const hitachiResponse = {
        parmSupplierInfo: { parmHoldCodes: holdCodes },
        parmPayments: []
      }

      const result = transformBusinessPayments(hitachiResponse)
      expect(result.onHold).toBe(expected)
    })
  })

  test('should handle missing supplier info', () => {
    const hitachiResponse = {
      parmPayments: [
        {
          parmPaymentReference: 'PAY001',
          parmDate: '2023-06-15T10:30:00Z',
          parmAmount: 1000,
          parmCurrency: 'GBP',
          parmLineItems: []
        }
      ]
    }

    const result = transformBusinessPayments(hitachiResponse)
    expect(result.onHold).toBe(false)
  })

  test('should handle missing payments array', () => {
    const hitachiResponse = {
      parmSupplierInfo: { parmHoldCodes: [] }
    }

    const result = transformBusinessPayments(hitachiResponse)
    expect(result.payments).toEqual([])
  })

  test('should sort payments by date (earliest first)', () => {
    const hitachiResponse = {
      parmSupplierInfo: { parmHoldCodes: [] },
      parmPayments: [
        {
          parmPaymentReference: 'PAY003',
          parmDate: '2023-07-01T00:00:00Z',
          parmAmount: 100,
          parmCurrency: 'GBP',
          parmLineItems: []
        },
        {
          parmPaymentReference: 'PAY001',
          parmDate: '2023-05-01T00:00:00Z',
          parmAmount: 100,
          parmCurrency: 'GBP',
          parmLineItems: []
        },
        {
          parmPaymentReference: 'PAY002',
          parmDate: '2023-06-01T00:00:00Z',
          parmAmount: 100,
          parmCurrency: 'GBP',
          parmLineItems: []
        }
      ]
    }

    const result = transformBusinessPayments(hitachiResponse)
    expect(result.payments.map((p) => p.reference)).toEqual(['PAY001', 'PAY002', 'PAY003'])
  })

  test('should handle multiple line items per payment', () => {
    const hitachiResponse = {
      parmSupplierInfo: { parmHoldCodes: [] },
      parmPayments: [
        {
          parmPaymentReference: 'PAY001',
          parmDate: '2023-06-15T10:30:00Z',
          parmAmount: 2000,
          parmCurrency: 'GBP',
          parmLineItems: [
            {
              parmAgreementNumber: 'AGR123',
              parmClaimRefNumber: 'CLAIM001',
              parmScheme: 'BPS',
              parmMarketingYear: '2023',
              parmDescription: 'Basic Payment',
              parmAmount: 1000
            },
            {
              parmAgreementNumber: 'AGR123',
              parmClaimRefNumber: 'CLAIM002',
              parmScheme: 'SFI',
              parmMarketingYear: '2023',
              parmDescription: 'Sustainable Farming',
              parmAmount: 1000
            }
          ]
        }
      ]
    }

    const result = transformBusinessPayments(hitachiResponse)
    expect(result.payments[0].lineItems).toHaveLength(2)
    expect(result.payments[0].lineItems[0].agreementClaimNo).toBe('AGR123/CLAIM001')
    expect(result.payments[0].lineItems[1].agreementClaimNo).toBe('AGR123/CLAIM002')
  })
})
