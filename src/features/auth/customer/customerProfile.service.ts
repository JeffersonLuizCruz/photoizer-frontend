import { apiClient } from '@/shared/api'

export interface CustomerProfile {
  id: string
  nome: string
  telefone: string
  email: string
  cpf: string | null
  cidade: string | null
  estado: string | null
}

export interface UpdateProfileRequest {
  nome: string
  telefone: string
  email: string
  cpf?: string
  cidade?: string
  estado?: string
}

export const customerProfileService = {
  getProfile: async (): Promise<CustomerProfile> => {
    const { data } = await apiClient.get<CustomerProfile>('/auth/cliente/perfil')
    return data
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<CustomerProfile> => {
    const { data } = await apiClient.put<CustomerProfile>('/auth/cliente/perfil', payload)
    return data
  },
}
