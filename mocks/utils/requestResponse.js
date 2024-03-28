import { StatusCodes } from 'http-status-codes'

const attachData = (res, data) => {
  res.setHeader('Content-Type', 'application/json')

  const isStringifiedData = typeof data === 'string'
  if (isStringifiedData) {
    res.end(data)
  } else {
    res.end(JSON.stringify(data))
  }
}

export const okResponse = (res, data) => {
  res.status(StatusCodes.OK)

  if (data) {
    attachData(res, data)
  }

  return res
}
