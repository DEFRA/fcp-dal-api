const { personHandler } = require('../../core/person/person')

module.exports = {
    Query: {
        Person: personHandler,
    },
}
