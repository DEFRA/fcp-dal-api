import rppAuthenticate from './rpp/authenticate.js'
import rppLms from './rpp/lms.js'
import rppOrganisation from './rpp/organisation.js'
import rppPerson from './rpp/person.js'
import rppSitiAgri from './rpp/siti-agri.js'

export const routes = [...rppAuthenticate, ...rppLms, ...rppOrganisation, ...rppPerson, ...rppSitiAgri]
