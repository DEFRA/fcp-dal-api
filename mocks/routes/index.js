import apimAuthentication from './apim/authentication.js'

import ruralPaymentsMessages from './rural-payments/messages.js'
import ruralPaymentsSitiAgri from './rural-payments/siti-agri.js'
import ruralPaymentsOrganisation from './rural-payments/organisation.js'
import ruralPaymentsPerson from './rural-payments/person.js'
import ruralPaymentsLms from './rural-payments/lms.js'

export const routes = [
  ...ruralPaymentsMessages,
  ...ruralPaymentsPerson,
  ...ruralPaymentsOrganisation,
  ...apimAuthentication,
  ...ruralPaymentsLms,
  ...ruralPaymentsSitiAgri
]
