export const retrieveAccessToken = async () => {
  const body = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scope: `${process.env.CLIENT_ID}/.default`,
    grant_type: 'client_credentials'
  }).toString()

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
