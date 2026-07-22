import { apiClient } from '@/shared/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  nome: string
  email: string
}

const TOKEN_KEY = 'photoizer_auth_token'
const USER_KEY = 'photoizer_auth_user'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { data: response } = await apiClient.post<LoginResponse>('/auth/login', data)
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify({ nome: response.nome, email: response.email }))
    return response
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  getUser(): { nome: string; email: string } | null {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },
}
