import fetch from 'node-fetch'
import qs from 'qs'

export const retrieveApimAccessToken = async () => {
  const body = qs.stringify({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scope: `api://${process.env.CLIENT_ID}/.default`,
    grant_type: 'client_credentials'
  })

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const response = await fetch(
    `${process.env.RP_INTERNAL_APIM_ACCESS_TOKEN_URL}${process.env.API_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      body,
      redirect: 'follow',
      headers
    }
  )
  const parsedResponse = await response.json()
  return parsedResponse.access_token
}
