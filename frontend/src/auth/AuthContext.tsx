import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import type { Credentials, Session, User } from '../api/types'
import { clearSession, loadSession, saveSession } from './storage'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (credentials: Credentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Holds "who is signed in" for the whole app, so any component can ask
 * useAuth() instead of passing the user down through props.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  // The API client raises this event when the server rejects our token (expired).
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout)
    return () => window.removeEventListener('auth:unauthorized', logout)
  }, [logout])

  const startSession = useCallback((next: Session) => {
    saveSession(next)
    setSession(next)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAdmin: session?.user.role === 'admin',
      login: async (credentials) => startSession(await authApi.login(credentials)),
      register: async (credentials) => startSession(await authApi.register(credentials)),
      logout,
    }),
    [session, startSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The provider and its hook live together on purpose: they are one unit.
// The lint rule below only affects hot-reload during development.
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
