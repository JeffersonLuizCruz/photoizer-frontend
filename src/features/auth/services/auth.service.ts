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

export interface MeResponse {
  nome: string
  email: string
  papel: 'ADMIN' | 'FOTOGRAFO' | 'EDITOR' | 'AGENDADOR'
  userId: string
}

// A3: o token NÃO é mais persistido (fica em cookie HttpOnly). Guardamos apenas
// os dados de exibição do usuário; a autenticação é validada pelo servidor.
const USER_KEY = 'photoizer_auth_user'

function parseUser(raw: string): MeResponse | null {
  try {
    const parsed = JSON.parse(raw) as Partial<MeResponse>
    if (!parsed?.email || !parsed?.papel) {
      localStorage.removeItem(USER_KEY)
      return null
    }
    return parsed as MeResponse
  } catch {
    // Sessão corrompida: descarta em vez de quebrar a aplicação (M4).
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function persistUser(user: MeResponse): void {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ nome: user.nome, email: user.email, papel: user.papel, userId: user.userId }),
  )
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { data: response } = await apiClient.post<LoginResponse>('/auth/login', data)
    persistUser(response)
    return response
  },

  /**
   * M4: deriva os dados de autorização do servidor (fonte de verdade) em vez de
   * confiar apenas no `localStorage`. Lança 401 se a sessão expirou.
   */
  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>('/auth/me')
    persistUser(data)
    return data
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Mesmo com falha no servidor, limpa o estado local.
    }
    localStorage.removeItem(USER_KEY)
  },

  getUser(): MeResponse | null {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? parseUser(raw) : null
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
