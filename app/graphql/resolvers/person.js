const { person } = require('../../core/person/person')

module.exports = {
    Query: {
        Person: () => (person),
    },
}
