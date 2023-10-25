const customer = {
  name: {
    referenceNumber: "323231",
    firstName: 'John',
    surname: 'Doe'
  },
  authenticationQuestions: {
    memorableDate: "",
    memorableEvent: "",
    memorablePlace: ""
  }
}

export function findCustomerByReferenceHandler (reference) {
  console.log('reference number is', reference)

  return customer
}
