import { RawJSON } from './raw-json.js'

// Character codes
const QUOTE = 34
const BACKSLASH = 92
const COMMA = 44
const COLON = 58
const OPEN_BRACE = 123
const CLOSE_BRACE = 125
const OPEN_BRACKET = 91
const CLOSE_BRACKET = 93

const isWhitespace = (code) => code === 32 || code === 10 || code === 13 || code === 9

const fail = (text, index, expected) => {
  throw new SyntaxError(`Invalid FeatureCollection JSON: expected ${expected} at position ${index}`)
}

const skipWhitespace = (text, index) => {
  while (index < text.length && isWhitespace(text.charCodeAt(index))) {
    index++
  }
  return index
}

const expectChar = (text, index, code) => {
  if (text.charCodeAt(index) !== code) {
    fail(text, index, `'${String.fromCharCode(code)}'`)
  }
}

// Returns the index after the closing quote of the string starting at `index`
const skipString = (text, index) => {
  let from = index + 1
  for (;;) {
    const quote = text.indexOf('"', from)
    if (quote === -1) {
      fail(text, index, 'a closing quote')
    }
    let backslashes = 0
    while (text.charCodeAt(quote - 1 - backslashes) === BACKSLASH) {
      backslashes++
    }
    if (backslashes % 2 === 0) {
      return quote + 1
    }
    from = quote + 1
  }
}

// Returns the index after the JSON value starting at `index`, without parsing it
const skipValue = (text, index) => {
  const code = text.charCodeAt(index)
  if (code === QUOTE) {
    return skipString(text, index)
  }
  if (code === OPEN_BRACE || code === OPEN_BRACKET) {
    // the closing characters expected for the objects/arrays currently open
    const closers = []
    for (let i = index; i < text.length; i++) {
      const c = text.charCodeAt(i)
      if (c === QUOTE) {
        i = skipString(text, i) - 1
      } else if (c === OPEN_BRACE) {
        closers.push(CLOSE_BRACE)
      } else if (c === OPEN_BRACKET) {
        closers.push(CLOSE_BRACKET)
      } else if (c === CLOSE_BRACE || c === CLOSE_BRACKET) {
        if (closers.pop() !== c) {
          fail(text, i, `'${String.fromCharCode(c === CLOSE_BRACE ? CLOSE_BRACKET : CLOSE_BRACE)}'`)
        }
        if (closers.length === 0) {
          return i + 1
        }
      }
    }
    fail(text, index, 'a closing bracket')
  }
  let i = index
  while (i < text.length) {
    const c = text.charCodeAt(i)
    if (c === COMMA || c === CLOSE_BRACE || c === CLOSE_BRACKET || isWhitespace(c)) {
      break
    }
    i++
  }
  if (i === index) {
    fail(text, index, 'a value')
  }
  return i
}

// Calls onMember(key, valueStart, valueEnd) for each member of the object starting at `index`,
// returning the index after the object
const forEachMember = (text, index, onMember) => {
  expectChar(text, index, OPEN_BRACE)
  let i = skipWhitespace(text, index + 1)
  if (text.charCodeAt(i) === CLOSE_BRACE) {
    return i + 1
  }
  for (;;) {
    expectChar(text, i, QUOTE)
    const keyEnd = skipString(text, i)
    const key = JSON.parse(text.slice(i, keyEnd))
    i = skipWhitespace(text, keyEnd)
    expectChar(text, i, COLON)
    const valueStart = skipWhitespace(text, i + 1)
    const valueEnd = skipValue(text, valueStart)
    onMember(key, valueStart, valueEnd)
    i = skipWhitespace(text, valueEnd)
    if (text.charCodeAt(i) === CLOSE_BRACE) {
      return i + 1
    }
    expectChar(text, i, COMMA)
    i = skipWhitespace(text, i + 1)
  }
}

// Calls onElement(valueStart) for each element of the array starting at `index`
const forEachElement = (text, index, onElement) => {
  expectChar(text, index, OPEN_BRACKET)
  let i = skipWhitespace(text, index + 1)
  if (text.charCodeAt(i) === CLOSE_BRACKET) {
    return
  }
  for (;;) {
    const valueEnd = skipValue(text, i)
    onElement(i, valueEnd)
    i = skipWhitespace(text, valueEnd)
    if (text.charCodeAt(i) === CLOSE_BRACKET) {
      return
    }
    expectChar(text, i, COMMA)
    i = skipWhitespace(text, i + 1)
  }
}

const isObject = (text, index) => text.charCodeAt(index) === OPEN_BRACE

const parseGeometry = (text, start, end) => {
  if (!isObject(text, start)) {
    return JSON.parse(text.slice(start, end))
  }
  const geometry = {}
  forEachMember(text, start, (key, valueStart, valueEnd) => {
    geometry[key] =
      key === 'coordinates'
        ? new RawJSON(text.slice(valueStart, valueEnd))
        : JSON.parse(text.slice(valueStart, valueEnd))
  })
  return geometry
}

const parseFeature = (text, start, end) => {
  if (!isObject(text, start)) {
    return JSON.parse(text.slice(start, end))
  }
  const feature = {}
  forEachMember(text, start, (key, valueStart, valueEnd) => {
    feature[key] =
      key === 'geometry'
        ? parseGeometry(text, valueStart, valueEnd)
        : JSON.parse(text.slice(valueStart, valueEnd))
  })
  return feature
}

/**
 * Parses GeoJSON FeatureCollection text, leaving each geometry's `coordinates` as RawJSON text
 * instead of parsing it into nested arrays.
 *
 * For large organisations the coordinates are almost all of the payload (~1.9 million points for
 * 23k parcels).  As JS arrays they take ~2.7x the memory of their JSON text, and must be parsed
 * and serialised again for the response.  The RawJSON values are slices of `text`, which V8
 * represents as references into it, not copies.
 *
 * Everything other than coordinates is parsed with JSON.parse, so is validated as usual.  The
 * coordinates are checked to be a single value with correctly nested brackets and terminated
 * strings, and are otherwise passed through as received.
 *
 * @param {string} text - the FeatureCollection JSON text
 * @returns {object} the FeatureCollection, with RawJSON coordinates
 */
export function parseFeatureCollectionWithRawCoordinates(text) {
  const start = skipWhitespace(text, 0)
  const collection = {}
  const collectionEnd = forEachMember(text, start, (key, valueStart, valueEnd) => {
    if (key === 'features' && text.charCodeAt(valueStart) === OPEN_BRACKET) {
      const features = []
      forEachElement(text, valueStart, (featureStart, featureEnd) => {
        features.push(parseFeature(text, featureStart, featureEnd))
      })
      collection.features = features
    } else {
      collection[key] = JSON.parse(text.slice(valueStart, valueEnd))
    }
  })
  const end = skipWhitespace(text, collectionEnd)
  if (end !== text.length) {
    fail(text, end, 'the end of the JSON')
  }
  return collection
}
