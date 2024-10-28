import fastRedact from 'fast-redact'
import { format } from 'winston'
import { sampleResponse } from './utils.js'

const serialize = info => {
  const symbols = Object.getOwnPropertySymbols(info).reduce((symbols, symbol) => {
    symbols[symbol] = info[symbol]
    return symbols
  }, {})
  const infoCloned = structuredClone(info)
  return {
    ...infoCloned,
    ...symbols
  }
}

const redact = fastRedact({
  paths: ['*.*.authorization', '*.*.Authorization', '*.*.access_token'],
  serialize
})

export const redactSensitiveData = format(redact)

export const sampleResponseBodyData = format(info => {
  if (info?.response?.body) {
    info.response.body = sampleResponse(info.response.body)
  }
  return info
})
