const customer = {
  name: {
    referenceNumber: "323231",
    firstName: 'John',
    surname: 'Doe'
  }
}

export function findCustomerByReferenceHandler (reference) {
  console.log('reference number is', reference)

  return customer
}
