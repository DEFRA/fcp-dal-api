function findAllExampleData (db) {
  const cursor = db
    .collection('example-data')
    .find({}, { projection: { _id: 0 } })

  return cursor.toArray()
}

function findExampleData (db, id) {
  return db
    .collection('example-data')
    .findOne({ exampleId: id }, { projection: { _id: 0 } })
}

export { findAllExampleData, findExampleData }
