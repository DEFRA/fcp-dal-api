const person = {
  firstName: 'John',
  surname: 'Doe'
}

function personHandler(parent, args, context) {
  console.log('parent', parent)
  console.log('args', args)
  console.log('context', context)

  return person
}

module.exports = {
  personHandler,
}
