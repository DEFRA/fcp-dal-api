/* eslint-env browser */
import { PublicClientApplication } from '@azure/msal-browser'
import { html } from 'htm/react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const configuration = {
  auth: {
    clientId: 'bfb6fb5c-9ec6-44f9-91d6-77378e41daa7',
    authority: 'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : ''
  },
  cache: {
    cacheLocation: 'localStorage'
  }
}

const msalInstance = new PublicClientApplication(configuration)
await msalInstance.initialize()

const AuthContext = createContext({ token: null, getToken: async () => null })

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!msalInstance.getActiveAccount())

  useEffect(() => {
    if (!isAuthenticated) {
      msalInstance
        .ssoSilent({ scopes: ['User.Read'] })
        .then((account) => {
          msalInstance.setActiveAccount(account)
          setIsAuthenticated(true)
        })
        .catch((error) => {
          console.error('Authentication failed:', error)
        })
    }
  }, [])

  const value = {
    getToken: useCallback(async () => {
      if (isAuthenticated) {
        const { accessToken } = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read']
        })
        return accessToken
      }

      return ''
    }, [isAuthenticated]),
    isAuthenticated
  }

  return html`<${AuthContext.Provider} value=${value}>${children}<//>`
}

export function useToken() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useToken must be used within an AuthProvider')
  }
  return context
}
