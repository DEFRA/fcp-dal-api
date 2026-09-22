import { printSchema } from 'graphql'
import { writeFile } from 'node:fs/promises'
import { createSchema } from '../app/graphql/schema.js'

const schema = await createSchema()

await writeFile('schema.graphql', printSchema(schema))
