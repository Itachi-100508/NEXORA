import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { mockLogin, mockForgotPassword } from '../services/mock'
import { ROLES } from '../constants'

const AuthContext = createContext(null)

const USER_KEY = 'examora_user'
const TOKEN_KEY = 'examora_token'

function isNetworkError(error) {
  return !error?.response || error?.code === 'ECONNABORTED' || error?.message === 'Network Error'
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const storedUser = readStoredUser()
      if (storedUser && token) {
        try {
          const me = await authService.getMe()
          setUser(me.user || storedUser)
        } catch {
          // fall back to stored user if network fails
        }
      }
      setLoading(false)
    }
    restoreSession()
  }, [token])

  const persist = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  }

  const isMock = (res) => typeof res?.token === 'string' && res.token.startsWith('mock-')

  const login = async (email, password) => {
    let res
    try {
      res = await authService.login({ email, password })
    } catch (error) {
      if (!isNetworkError(error)) throw error
      res = await mockLogin(email, password)
      window.__EXAMORA_MOCK__ = true
    }
    const newToken = res.token || res.accessToken
    const newUser = res.user
    persist(newToken, newUser)
    return { user: newUser, isMock: isMock(res) }
  }

  const forgotPassword = async (email) => {
    try {
      const res = await authService.forgotPassword(email)
      return res.message || 'Password reset link sent to your email.'
    } catch (error) {
      if (!isNetworkError(error)) throw error
      return mockForgotPassword(email).then((r) => r.message)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const updateUser = useCallback((patch) => {
    const next = { ...user, ...patch }
    setUser(next)
    localStorage.setItem(USER_KEY, JSON.stringify(next))
  }, [user])

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout,
      forgotPassword,
      updateUser,
      ROLES,
    }),
    [user, token, loading, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
