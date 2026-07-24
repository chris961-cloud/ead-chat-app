import { useState } from "react"

const API_BASE = "http://127.0.0.1:8000"
const TOKEN_KEY = "auth_token"
const USERNAME_KEY = "auth_username"

/**
 * Reads the stored token and username from localStorage.
 * Returns { token, username } or { token: null, username: null } if not logged in.
 */
function readStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  const username = localStorage.getItem(USERNAME_KEY)
  return token && username ? { token, username } : { token: null, username: null }
}

/**
 * Manages authentication state for the whole app.
 *
 * Returns:
 *   user         — { username } object when logged in, null when not
 *   login()      — POST /api/auth/login, store token, update state
 *   signup()     — POST /api/auth/signup, store token, update state
 *   logout()     — clear token + state
 *   authError    — most recent error string (or null)
 */
export function useAuth() {
  const stored = readStoredAuth()
  const [user, setUser] = useState(stored.username ? { username: stored.username } : null)
  const [authError, setAuthError] = useState(null)

  function _storeAndSetUser(token, username) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USERNAME_KEY, username)
    setUser({ username })
    setAuthError(null)
  }

  async function login(username, password) {
    setAuthError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.detail ?? "Login failed")
        return false
      }
      _storeAndSetUser(data.access_token, data.username)
      return true
    } catch {
      setAuthError("Could not reach the server. Is the backend running?")
      return false
    }
  }

  async function signup(username, email, password) {
    setAuthError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email: email || null, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.detail ?? "Sign up failed")
        return false
      }
      _storeAndSetUser(data.access_token, data.username)
      return true
    } catch {
      setAuthError("Could not reach the server. Is the backend running?")
      return false
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    setUser(null)
    setAuthError(null)
  }

  return { user, login, signup, logout, authError }
}
