import { apiClient } from '@/shared/api'
import type { Pacote, UsuarioRef } from '../types'
import type { PacoteFormData } from '../schemas/pacote.schema'

export const pacoteService = {
  listUsuarios: async (): Promise<UsuarioRef[]> => {
    const { data } = await apiClient.get<UsuarioRef[]>('/usuarios')
    return data
  },

  list: async (): Promise<Pacote[]> => {
    const { data } = await apiClient.get<Pacote[]>('/pacotes/all')
    return data
  },

  getById: async (id: string): Promise<Pacote> => {
    const { data } = await apiClient.get<Pacote>(`/pacotes/${id}`)
    return data
  },

  create: async (payload: PacoteFormData): Promise<Pacote> => {
    const { data } = await apiClient.post<Pacote>('/pacotes', payload)
    return data
  },

  update: async (id: string, payload: PacoteFormData): Promise<Pacote> => {
    const { data } = await apiClient.put<Pacote>(`/pacotes/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/pacotes/${id}`)
  },
}
