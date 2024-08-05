import apimAuthentication from './apim/authentication.js'
import rppAuthenticate from './rpp/authenticate.js'
import rppLms from './rpp/lms.js'
import rppMessages from './rpp/messages.js'
import rppOrganisation from './rpp/organisation.js'
import rppPerson from './rpp/person.js'
import rppSitiAgri from './rpp/siti-agri.js'
import v1Organisation from './v1/organisation.js'
import v1Person from './v1/person.js'

export const routes = [...rppAuthenticate, ...rppLms, ...rppOrganisation, ...rppPerson, ...rppSitiAgri, ...rppMessages, ...v1Person, ...v1Organisation, ...apimAuthentication]
