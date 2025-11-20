/* eslint-env browser */
// Import MSAL
import { PublicClientApplication } from '@azure/msal-browser'

// MSAL config
const msalConfig = {
  auth: {
    clientId: 'bfb6fb5c-9ec6-44f9-91d6-77378e41daa7', // From Azure AD app registration
    authority: 'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0',
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage' // Persists across refreshes
  }
}

const msalInstance = new PublicClientApplication(msalConfig)

// Authentication request
const request = {
  scopes: ['User.Read'] // Adjust scopes as needed
}

// Function to get redirectTo parameter from URL
function getRedirectTo() {
  const params = new URLSearchParams(window.location.search)
  return params.get('redirectTo') || '/' // Default to root if no redirectTo
}

// Function to update button visibility
function updateButtonVisibility(isAuthenticated) {
  document.getElementById('loginButton').style.display = isAuthenticated ? 'none' : 'block'
  document.getElementById('logoutButton').style.display = isAuthenticated ? 'block' : 'none'
}

// Function to try silent authentication
async function trySilentAuth() {
  await msalInstance.initialize()

  // Check for cached accounts
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    console.log('No accounts found in cache. Showing login button.')
    updateButtonVisibility(false)
    return
  }

  // Use the first account
  request.account = accounts[0]

  try {
    const response = await msalInstance.acquireTokenSilent(request)
    console.log('Token acquired silently:', response.idToken)
    updateButtonVisibility(true) // Show logout button, hide login button
    // Redirect with token
    const redirectTo = getRedirectTo()
    window.location.href = `${redirectTo}?token=${encodeURIComponent(response.idToken)}`
  } catch (error) {
    console.log('Silent authentication failed:', error)
    updateButtonVisibility(false) // Show login button, hide logout button
  }
}

// Function to handle login button click
async function handleLogin() {
  try {
    const response = await msalInstance.acquireTokenPopup(request)
    console.log('Token acquired via popup:', response.idToken)
    updateButtonVisibility(true) // Show logout button, hide login button
    // Redirect with token
    const redirectTo = getRedirectTo()
    window.location.href = `${redirectTo}?token=${encodeURIComponent(response.idToken)}`
  } catch (error) {
    console.error('Login failed:', error)
  }
}

// Function to handle logout button click
async function handleLogout() {
  try {
    await msalInstance.logoutPopup()
    console.log('Logged out successfully')
    updateButtonVisibility(false) // Show login button, hide logout button
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

window.handleLogin = handleLogin
window.handleLogout = handleLogout

// Run silent auth on page load
trySilentAuth()
