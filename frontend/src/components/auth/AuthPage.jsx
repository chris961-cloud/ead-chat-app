import { useState } from "react"

/**
 * Full-screen auth page with Sign In / Sign Up tabs.
 * Matches the existing dark theme (slate-950 bg, slate-900 card, indigo accents).
 *
 * Props:
 *   onLogin  (username, password) => Promise<boolean>
 *   onSignup (username, email, password) => Promise<boolean>
 *   authError  string | null  — error from the last failed attempt
 */
export function AuthPage({ onLogin, onSignup, authError }) {
  const [tab, setTab] = useState("signin") // "signin" | "signup"

  // Sign-in state
  const [siUsername, setSiUsername] = useState("")
  const [siPassword, setSiPassword] = useState("")

  // Sign-up state
  const [suUsername, setSuUsername] = useState("")
  const [suEmail, setSuEmail]       = useState("")
  const [suPassword, setSuPassword] = useState("")
  const [suConfirm, setSuConfirm]   = useState("")
  const [localError, setLocalError] = useState(null)

  const [loading, setLoading] = useState(false)

  // The error to show can come from the hook (server) or local validation
  const displayError = localError ?? authError

  async function handleSignIn(e) {
    e.preventDefault()
    setLocalError(null)
    if (!siUsername || !siPassword) {
      setLocalError("Please fill in all fields.")
      return
    }
    setLoading(true)
    await onLogin(siUsername, siPassword)
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setLocalError(null)
    if (!suUsername || !suPassword || !suConfirm) {
      setLocalError("Please fill in all required fields.")
      return
    }
    if (suPassword !== suConfirm) {
      setLocalError("Passwords do not match.")
      return
    }
    if (suPassword.length < 6) {
      setLocalError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    await onSignup(suUsername, suEmail, suPassword)
    setLoading(false)
  }

  function switchTab(newTab) {
    setTab(newTab)
    setLocalError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">

        {/* Logo / heading */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-3">
            {/* Simple chat bubble icon */}
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-50">EAD Chat</h1>
          <p className="text-sm text-slate-400 mt-1">
            {tab === "signin" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-slate-800 p-1 mb-6">
          <button
            type="button"
            onClick={() => switchTab("signin")}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-200 ${
              tab === "signin"
                ? "bg-slate-700 text-slate-50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab("signup")}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-200 ${
              tab === "signup"
                ? "bg-slate-700 text-slate-50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error banner */}
        {displayError && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-sm">
            {displayError}
          </div>
        )}

        {/* ── Sign In Form ── */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4" id="signin-form">
            <div>
              <label htmlFor="si-username" className="block text-xs font-medium text-slate-400 mb-1">
                Username
              </label>
              <input
                id="si-username"
                type="text"
                autoComplete="username"
                value={siUsername}
                onChange={(e) => setSiUsername(e.target.value)}
                placeholder="your_username"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 text-sm transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="si-password" className="block text-xs font-medium text-slate-400 mb-1">
                Password
              </label>
              <input
                id="si-password"
                type="password"
                autoComplete="current-password"
                value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 text-sm transition-colors duration-200"
              />
            </div>

            <button
              id="signin-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-all duration-200 text-sm"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {/* ── Sign Up Form ── */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4" id="signup-form">
            <div>
              <label htmlFor="su-username" className="block text-xs font-medium text-slate-400 mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                id="su-username"
                type="text"
                autoComplete="username"
                value={suUsername}
                onChange={(e) => setSuUsername(e.target.value)}
                placeholder="your_username"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 text-sm transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="su-email" className="block text-xs font-medium text-slate-400 mb-1">
                Email <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 text-sm transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="su-password" className="block text-xs font-medium text-slate-400 mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                id="su-password"
                type="password"
                autoComplete="new-password"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 text-sm transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="su-confirm" className="block text-xs font-medium text-slate-400 mb-1">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                id="su-confirm"
                type="password"
                autoComplete="new-password"
                value={suConfirm}
                onChange={(e) => setSuConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 text-sm transition-colors duration-200"
              />
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-all duration-200 text-sm"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
