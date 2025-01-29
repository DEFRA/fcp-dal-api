import fastRedact from 'fast-redact'
import { format } from 'winston'
import { sampleResponse } from './utils.js'

export const serialize = (info) => {
  const infoSymbols = Object.getOwnPropertySymbols(info).reduce((symbols, symbol) => {
    symbols[symbol] = info[symbol]
    return symbols
  }, {})

  try {
    const infoCloned = structuredClone(info)
    return { ...infoCloned, ...infoSymbols }
  } catch (_) {
    try {
      const safeClone = safeStructuredClone(info)
      return { ...safeClone, ...infoSymbols }
    } catch (error) {
      return {
        level: 'error',
        message: `Error cloning log data! Redacting for safety\n${info.message}`,
        code: info.code,
        stack: error.stack,
        ...infoSymbols
      }
    }
  }
}

export const safeSerialise = (value) => {
  if (value) return value.entries ? Object.fromEntries(value.entries()) : value.toString()
  return value
}

export const safeStructuredClone = (info) => {
  const clone = { ...info }

  // NOTE: for speed and simplicity, known unserialisable values are specially handled below
  if (clone.request) {
    clone.request = {
      ...info.request,
      params: safeSerialise(info.request?.params),
      path: safeSerialise(info.request?.path)
    }
  }
  if (clone.response) {
    clone.response = {
      ...info.response,
      headers: safeSerialise(info.response?.headers)
    }
  }

  return structuredClone(clone)
}

export const redactSensitiveData = format(
  fastRedact({
    paths: ['*.*.access_token', '*.*.authorization', '*.*.Authorization'],
    serialize
  })
)

export const sampleResponseBodyData = format((info) => {
  if (info?.response?.body) {
    info.response.body = sampleResponse(info.response.body)
  }
  return info
})
