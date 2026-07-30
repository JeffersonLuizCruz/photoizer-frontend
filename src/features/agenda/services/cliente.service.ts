import { apiClient } from '@/shared/api'
import type { Cliente } from '../types/cliente'
import type { ClienteFormData } from '../schemas/cliente.schema'

export const clienteService = {
  getById: async (id: string): Promise<Cliente> => {
    const { data } = await apiClient.get<Cliente>(`/clientes/${id}`)
    return data
  },

  update: async (id: string, payload: ClienteFormData): Promise<Cliente> => {
    const { data } = await apiClient.put<Cliente>(`/clientes/${id}`, payload)
    return data
  },
}
