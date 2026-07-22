import { apiClient } from '@/shared/api'
import type { Cliente, ClienteListParams, ClienteListResponse } from '../types'
import type { ClienteFormData } from '../schemas/cliente.schema'

export const clienteService = {
  list: async (params?: ClienteListParams): Promise<ClienteListResponse> => {
    const { data } = await apiClient.get<ClienteListResponse>('/clientes', { params })
    return data
  },

  getById: async (id: string): Promise<Cliente> => {
    const { data } = await apiClient.get<Cliente>(`/clientes/${id}`)
    return data
  },

  create: async (payload: ClienteFormData): Promise<Cliente> => {
    const { data } = await apiClient.post<Cliente>('/clientes', payload)
    return data
  },

  update: async (id: string, payload: ClienteFormData): Promise<Cliente> => {
    const { data } = await apiClient.put<Cliente>(`/clientes/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clientes/${id}`)
  },

  listarAgendamentos: async (clienteId: string): Promise<import('@/features/agenda/types').Agendamento[]> => {
    const { data } = await apiClient.get<import('@/features/agenda/types').Agendamento[]>(`/clientes/${clienteId}/agendamentos`)
    return data
  },
}
