import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })

const coveragePath = 'schema-coverage.json'
const fieldThresholdInput = process.env.SCHEMA_FIELD_COVERAGE_THRESHOLD ?? 80
const fieldThreshold = Number(fieldThresholdInput)
const typeThresholdInput = process.env.SCHEMA_TYPE_COVERAGE_THRESHOLD ?? 80
const typeThreshold = Number(typeThresholdInput)

if (!Number.isFinite(fieldThreshold)) {
  throw new TypeError(`Invalid field coverage threshold: "${fieldThresholdInput}" is not a number`)
}

if (!Number.isFinite(typeThreshold)) {
  throw new TypeError(`Invalid type coverage threshold: "${typeThresholdInput}" is not a number`)
}

const report = JSON.parse(await readFile(coveragePath, 'utf8'))
const { stats, types } = report

const percentage = (covered, total) => (total > 0 ? (covered / total) * 100 : 100)

const typesCoveredPct = percentage(stats.numTypesCovered, stats.numTypes)
const fieldsCoveredPct = percentage(stats.numFieldsCovered, stats.numFields)

console.log(
  `Types covered:  ${typesCoveredPct.toFixed(1)}% (${stats.numTypesCovered}/${stats.numTypes})`
)
console.log(
  `Fields covered: ${fieldsCoveredPct.toFixed(1)}% (${stats.numFieldsCovered}/${stats.numFields})`
)

let failed = false

if (typesCoveredPct < typeThreshold) {
  failed = true
  const uncovered = Object.entries(types)
    .filter(([, type]) => !type.hits)
    .map(([typeName]) => typeName)

  console.error(
    `\nSchema type coverage ${typesCoveredPct.toFixed(1)}% is below the required ${typeThreshold}% threshold.`
  )
  if (uncovered.length) {
    console.error(`\nUncovered types (${uncovered.length}):`)
    uncovered.forEach((type) => console.error(`  - ${type}`))
  }
}

if (fieldsCoveredPct < fieldThreshold) {
  failed = true
  const uncovered = Object.entries(types).flatMap(([typeName, type]) =>
    Object.entries(type.children ?? {})
      .filter(([, field]) => !field.hits)
      .map(([fieldName]) => `${typeName}.${fieldName}`)
  )

  console.error(
    `\nSchema field coverage ${fieldsCoveredPct.toFixed(1)}% is below the required ${fieldThreshold}% threshold.`
  )
  if (uncovered.length) {
    console.error(`\nUncovered fields (${uncovered.length}):`)
    uncovered.forEach((field) => console.error(`  - ${field}`))
  }
}

if (failed) {
  process.exit(1)
}

console.log(
  `\nSchema type coverage ${typesCoveredPct.toFixed(1)}% meets the required ${typeThreshold}% threshold.`
)
console.log(
  `Schema field coverage ${fieldsCoveredPct.toFixed(1)}% meets the required ${fieldThreshold}% threshold.`
)
