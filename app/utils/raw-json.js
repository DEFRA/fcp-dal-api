import { randomUUID } from 'node:crypto'

// Collectors for the stringifyWithRawJSON calls in progress.  JSON.stringify is synchronous, so a
// RawJSON's toJSON can only ever be called by the innermost (last) collector.
const collectors = []

/**
 * A value that is already serialised JSON text, e.g. GeoJSON coordinates sliced from an upstream
 * response.  stringifyWithRawJSON writes the text into its output verbatim, avoiding the memory
 * and CPU of parsing it into JS values and serialising it again.
 *
 * Anything else that serialises a RawJSON (e.g. a plain JSON.stringify) gets the parsed value, so
 * output is always the same, just without the saving.
 */
export class RawJSON {
  constructor(text) {
    this.text = text
  }

  toJSON() {
    const collector = collectors.at(-1)
    if (!collector) {
      return JSON.parse(this.text)
    }
    collector.texts.push(this.text)
    return `${collector.token}${collector.texts.length - 1}`
  }
}

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)

/**
 * JSON.stringify, writing any RawJSON values' text into the output verbatim.
 *
 * Each RawJSON is first serialised as a placeholder string containing a per-call random token
 * (which can't occur in real data), and the placeholders are then replaced with the raw text.
 */
export function stringifyWithRawJSON(value) {
  // \u0000 is escaped by JSON.stringify, so the placeholder can't be confused with a JSON token
  const collector = { token: `\u0000raw-json-${randomUUID()}:`, texts: [] }
  collectors.push(collector)
  let json
  try {
    json = JSON.stringify(value)
  } finally {
    collectors.pop()
  }

  if (collector.texts.length === 0) {
    return json
  }

  // How the placeholder appears in the output: a JSON string, with \u0000 escaped
  const escapedToken = JSON.stringify(collector.token).slice(1, -1)
  const placeholder = new RegExp(String.raw`"${escapeRegExp(escapedToken)}(\d+)"`, 'g')
  return json.replace(placeholder, (_, index) => collector.texts[index])
}
