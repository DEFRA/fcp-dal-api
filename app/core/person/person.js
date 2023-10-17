const person = {
  firstName: 'John',
  surname: 'Doe'
}

export function personHandler (parent, args, context) {
  console.log('parent', parent)
  console.log('args', args)
  console.log('context', context)

  return person
}
