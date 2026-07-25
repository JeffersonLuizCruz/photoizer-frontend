import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authService } from './services/auth.service'

export type Papel = 'ADMIN' | 'FOTOGRAFO' | 'EDITOR' | 'AGENDADOR'

interface AuthUser {
  nome: string
  email: string
  papel: Papel
  userId: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  papel: Papel | null
  isAdmin: boolean
  isFotografo: boolean
  isEditor: boolean
  isAgendador: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = authService.getUser()
    if (saved && authService.getToken()) {
      setUser(saved as AuthUser)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    const userData: AuthUser = {
      nome: response.nome,
      email: response.email,
      papel: response.papel as Papel,
      userId: response.userId,
    }
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const papel = user?.papel ?? null
  const isAdmin = papel === 'ADMIN'
  const isFotografo = papel === 'FOTOGRAFO'
  const isEditor = papel === 'EDITOR'
  const isAgendador = papel === 'AGENDADOR'

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, papel, isAdmin, isFotografo, isEditor, isAgendador }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}