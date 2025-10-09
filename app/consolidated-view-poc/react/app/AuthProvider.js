/* eslint-env browser */
import { PublicClientApplication } from '@azure/msal-browser'
import { html } from 'htm/react'
import { createContext, useContext, useEffect, useMemo } from 'react'

const configuration = {
  auth: {
    clientId: 'bfb6fb5c-9ec6-44f9-91d6-77378e41daa7',
    authority: 'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : ''
  },
  cache: {
    storeAuthStateInCookie: true
  }
}

const pca = new PublicClientApplication(configuration)
await pca.initialize()

const AuthContext = createContext({ token: null, getToken: async () => null })

export function AuthProvider({ children }) {
  const accounts = useMemo(() => pca.getAllAccounts(), [pca])

  // Handle authentication on mount
  useEffect(() => {
    const authenticate = async () => {
      try {
        if (accounts.length === 0) {
          await pca.ssoSilent({
            scopes: ['User.Read']
          })
        }
      } catch (error) {
        console.error('Authentication failed:', error)
      }
    }

    authenticate()
  }, [])

  // Context value
  const value = {
    async getToken() {
      if (accounts.length > 0) {
        console.log('acquireTokenSilent')
        return pca.acquireTokenSilent({
          account: accounts[0],
          scopes: ['User.Read']
        })
      }

      console.log('acquireTokenSilent')
      return null
    },
    token: null
  }

  return html`<${AuthContext.Provider} value=${value}>${children}<//>`
}

// Hook to use token
export function useToken() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useToken must be used within an AuthProvider')
  }
  return context
}
