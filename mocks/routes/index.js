import apimAuthentication from './apim/authentication.js'

import ruralPaymentsAuthenticate from './rural-payments/authenticate.js'
import ruralPaymentsLms from './rural-payments/lms.js'
import ruralPaymentsMessages from './rural-payments/messages.js'
import ruralPaymentsOrganisation from './rural-payments/organisation.js'
import ruralPaymentsPerson from './rural-payments/person.js'
import ruralPaymentsSitiAgri from './rural-payments/siti-agri.js'

export const routes = [
  ...ruralPaymentsMessages,
  ...ruralPaymentsPerson,
  ...ruralPaymentsOrganisation,
  ...apimAuthentication,
  ...ruralPaymentsLms,
  ...ruralPaymentsSitiAgri,
  ...ruralPaymentsAuthenticate
]
