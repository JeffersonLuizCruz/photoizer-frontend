import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authService } from './services/auth.service'
import { useCustomerAuth } from './customer'
import { customerProfileService } from './customer/customerProfile.service'

function isUnauthorized(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 401
}

export type Papel = 'ADMIN' | 'FOTOGRAFO' | 'EDITOR' | 'AGENDADOR'

export interface AuthUser {
  nome: string
  email: string
  papel: Papel
  userId: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
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
    let cancelled = false

    const handleRedirect = (e: Event) => {
      const path = (e as CustomEvent).detail
      window.location.href = path
    }
    window.addEventListener('auth:redirect', handleRedirect)

    // M4: revalida a sessão no servidor. O papel/nome passam a vir do backend,
    // não do localStorage. 401 encerra a sessão; falha de rede mantém o cache.
    const revalidar = async () => {
      const saved = authService.getUser()
      if (saved) {
        try {
          const server = await authService.me()
          if (!cancelled) setUser(server as AuthUser)
        } catch (error) {
          if (!cancelled && isUnauthorized(error)) {
            setUser(null)
          } else if (!cancelled) {
            setUser(saved as AuthUser)
          }
        }
      }

      const customer = useCustomerAuth.getState().user
      if (customer) {
        try {
          const perfil = await customerProfileService.getProfile()
          if (!cancelled) {
            useCustomerAuth.getState().updateUser({
              nome: perfil.nome,
              email: perfil.email,
              telefone: perfil.telefone,
            })
          }
        } catch (error) {
          if (!cancelled && isUnauthorized(error)) {
            useCustomerAuth.getState().logout()
          }
        }
      }

      if (!cancelled) setIsLoading(false)
    }

    void revalidar()

    return () => {
      cancelled = true
      window.removeEventListener('auth:redirect', handleRedirect)
    }
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
    return userData
  }, [])

  const logout = useCallback(() => {
    void authService.logout()
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