import { StatusCodes } from 'http-status-codes'

export const okResponse = (res, data) => {
  res.status(StatusCodes.OK)
  res.setHeader('Content-Type', 'application/json')

  if (typeof data === 'string') {
    res.end(data)
  } else {
    res.json(data)
  }
}

export const notFoundResponse = (res) => {
  res.status(StatusCodes.NOT_FOUND)
  res.end()
}

export const badRequestResponse = (res) => {
  res.status(StatusCodes.BAD_REQUEST)
  res.end()
}

export const okOrNotFoundResponse = (res, data) => {
  if (!data) {
    return notFoundResponse(res)
  }

  return okResponse(res, data)
}
