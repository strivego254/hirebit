'use client'

import { createContext, useContext, useState } from 'react'

interface AuthUser {
  email: string
  id?: string
  created_at?: string
}

interface AuthContextType {
  user: null | AuthUser
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: null | { message: string } }>
  signIn: (email: string, password: string) => Promise<{ error: null | { message: string } }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<null | AuthUser>(null)
  const [loading, setLoading] = useState(false)

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return { error: { message: data?.error || data?.details || 'Sign up failed' } }
      }
      if (data?.token) {
        localStorage.setItem('token', data.token)
        setUser({ 
          email: email.toLowerCase(),
          id: data?.user?.user_id,
          created_at: data?.user?.created_at
        })
      }
      return { error: null }
    } catch (err) {
      // Network error or other fetch errors
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { error: { message: 'Cannot connect to server. Please ensure the backend is running on port 3001.' } }
      }
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return { error: { message: data?.error || data?.details || 'Sign in failed' } }
      }
      if (data?.token) {
        localStorage.setItem('token', data.token)
        setUser({ email })
      }
      return { error: null }
    } catch (err) {
      // Network error or other fetch errors
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { error: { message: 'Cannot connect to server. Please ensure the backend is running on port 3001.' } }
      }
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
