import apimAuthentication from './apim/authentication.js'
import rppAuthenticate from './rpp/authenticate.js'
import rppLms from './rpp/lms.js'
import rppOrganisation from './rpp/organisation.js'

import ruralPaymentsMessages from './rural-payments/messages.js'
import ruralPaymentsSitiAgri from './rural-payments/siti-agri.js'
import ruralPaymentsOrganisation from './rural-payments/organisation.js'
import ruralPaymentsPerson from './rural-payments/person.js'
import ruralPaymentsLms from './rural-payments/lms.js'

export const routes = [
  ...rppAuthenticate,
  ...rppLms,
  ...rppOrganisation,
  ...ruralPaymentsMessages,
  ...ruralPaymentsPerson,
  ...ruralPaymentsOrganisation,
  ...apimAuthentication,
  ...ruralPaymentsLms,
  ...ruralPaymentsSitiAgri
]
