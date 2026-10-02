import { apiClient } from '@/shared/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  nome: string
  email: string
  papel: 'ADMIN' | 'FOTOGRAFO' | 'EDITOR' | 'AGENDADOR'
  userId: string
}

// A3: o token NÃO é mais persistido (fica em cookie HttpOnly). Guardamos apenas
// os dados de exibição do usuário; a autenticação é validada pelo servidor.
const USER_KEY = 'photoizer_auth_user'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { data: response } = await apiClient.post<LoginResponse>('/auth/login', data)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ nome: response.nome, email: response.email, papel: response.papel, userId: response.userId }),
    )
    return response
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Mesmo com falha no servidor, limpa o estado local.
    }
    localStorage.removeItem(USER_KEY)
  },

  getUser(): { nome: string; email: string; papel: string; userId: string } | null {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },

  /**
   * A autenticação agora depende de cookie HttpOnly, não verificável no cliente.
   * Presença dos dados do usuário indica sessão iniciada; o backend rejeitará
   * requisições se o cookie estiver ausente/expirado (401 → redirect).
   */
  isAuthenticated(): boolean {
    return !!this.getUser()
  },
}
