import { readFile } from 'node:fs/promises'

const coveragePath = 'schema-coverage.json'
const thresholdInput = process.env.SCHEMA_COVERAGE_THRESHOLD ?? 80
const threshold = Number(thresholdInput)

if (!Number.isFinite(threshold)) {
  throw new TypeError(`Invalid coverage threshold: "${thresholdInput}" is not a number`)
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

if (fieldsCoveredPct < threshold) {
  const uncovered = Object.entries(types).flatMap(([typeName, type]) =>
    Object.entries(type.children ?? {})
      .filter(([, field]) => !field.hits)
      .map(([fieldName]) => `${typeName}.${fieldName}`)
  )

  console.error(
    `\nSchema coverage ${fieldsCoveredPct.toFixed(1)}% is below the required ${threshold}% threshold.`
  )
  if (uncovered.length) {
    console.error(`\nUncovered fields (${uncovered.length}):`)
    uncovered.forEach((field) => console.error(`  - ${field}`))
  }

  process.exit(1)
}

console.log(
  `\nSchema coverage ${fieldsCoveredPct.toFixed(1)}% meets the required ${threshold}% threshold.`
)
