const API_BASE = "http://127.0.0.1:8000"

/**
 * A thin wrapper around fetch() that automatically attaches the stored JWT
 * as an Authorization header on every request.
 *
 * TOKEN STORAGE NOTE: The token is kept in localStorage, which means any
 * JavaScript on the page can read it (XSS risk).  For a university project
 * this is the simplest and most readable approach.  In production you would
 * use httpOnly cookies instead — the browser stores them, JS cannot read
 * them, but they require extra CORS setup (credentials: "include" on both
 * client and server).
 *
 * Usage:  apiFetch("/api/conversations")
 *         apiFetch("/api/chat", { method: "POST", body: JSON.stringify({...}) })
 *
 * You do NOT need to pass a Content-Type header — it is added automatically.
 */
export function apiFetch(path, options = {}) {
  const token = localStorage.getItem("auth_token")

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Allow callers to override individual headers if needed
      ...options.headers,
    },
  })
}
