import apimAuthentication from './apim/authentication.js'
import rppAuthenticate from './rpp/authenticate.js'
import rppLms from './rpp/lms.js'
import rppMessages from './rural-payments/messages.js'
import rppOrganisation from './rpp/organisation.js'
import rppSitiAgri from './rural-payments/siti-agri.js'
import ruralPaymentsOrganisation from './rural-payments/organisation.js'
import ruralPaymentsPerson from './rural-payments/person.js'

export const routes = [
  ...rppAuthenticate,
  ...rppLms,
  ...rppOrganisation,
  ...rppSitiAgri,
  ...rppMessages,
  ...ruralPaymentsPerson,
  ...ruralPaymentsOrganisation,
  ...apimAuthentication
]
