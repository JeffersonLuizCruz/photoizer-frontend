import { apiClient } from '@/shared/api'
import type { PaginatedResponse } from '@/shared/types'

export interface Notificacao {
  id: string
  createdAt: string
  titulo: string
  mensagem: string
  link: string | null
  tipo: string
  lida: boolean
}

export const notificacaoService = {
  listar: async (page = 1, size = 50): Promise<PaginatedResponse<Notificacao>> => {
    const { data } = await apiClient.get('/notificacoes', { params: { page, size } })
    return data
  },

  contarNaoLidas: async (): Promise<number> => {
    const { data } = await apiClient.get<number>('/notificacoes/nao-lidas')
    return data
  },

  marcarComoLida: async (id: string): Promise<void> => {
    await apiClient.patch(`/notificacoes/${id}/ler`)
  },

  marcarTodasComoLidas: async (): Promise<void> => {
    await apiClient.patch('/notificacoes/ler-todas')
  },

  limpar: async (): Promise<void> => {
    await apiClient.patch('/notificacoes/limpar')
  },
}
