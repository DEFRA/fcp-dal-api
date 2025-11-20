/* eslint-env browser */
import { InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser'
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

const silentRequest = {
  scopes: ['openid', 'profile', 'email']
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!msalInstance.getActiveAccount())

  useEffect(() => {
    const handlePopupAuth = async () => {
      try {
        const account = await msalInstance.loginPopup(silentRequest)
        msalInstance.setActiveAccount(account)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('loginPopup Authentication failed:', error)
      }
    }

    const handleSilentAuth = async () => {
      try {
        const account = await msalInstance.ssoSilent(silentRequest)
        msalInstance.setActiveAccount(account)
        setIsAuthenticated(true)
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          await handlePopupAuth()
        } else {
          console.error('ssoSilent Authentication failed:', error)
        }
      }
    }

    const authenticate = async () => {
      if (isAuthenticated) return
      await handleSilentAuth()
    }

    authenticate()
  }, [])

  const value = {
    getToken: useCallback(async () => {
      if (isAuthenticated) {
        const { idToken } = await msalInstance.acquireTokenSilent(silentRequest)
        return idToken
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
