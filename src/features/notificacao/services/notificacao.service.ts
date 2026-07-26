import { apiClient } from '@/shared/api'
import type { Notificacao } from '../types'

export const notificacaoService = {
  listar: async (): Promise<Notificacao[]> => {
    const { data } = await apiClient.get<Notificacao[]>('/notificacoes')
    return data
  },

  countNaoLidas: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>('/notificacoes/nao-lidas')
    return data.count
  },

  marcarComoLida: async (id: string): Promise<void> => {
    await apiClient.put(`/notificacoes/${id}/ler`)
  },

  marcarTodasComoLidas: async (): Promise<void> => {
    await apiClient.put('/notificacoes/ler-todas')
  },
}
