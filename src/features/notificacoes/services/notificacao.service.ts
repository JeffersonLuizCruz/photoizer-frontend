import { apiClient } from '@/shared/api'

export interface Notificacao {
  id: string
  userId: string
  titulo: string
  mensagem: string
  link: string | null
  tipo: string
  lida: boolean
  createdAt: string
}

export const notificacaoService = {
  listar: async (userId: string): Promise<Notificacao[]> => {
    const { data } = await apiClient.get<Notificacao[]>('/notificacoes', { params: { userId } })
    return data
  },

  contarNaoLidas: async (userId: string): Promise<number> => {
    const { data } = await apiClient.get<number>('/notificacoes/nao-lidas', { params: { userId } })
    return data
  },

  marcarComoLida: async (id: string): Promise<void> => {
    await apiClient.patch(`/notificacoes/${id}/ler`)
  },

  marcarTodasComoLidas: async (userId: string): Promise<void> => {
    await apiClient.patch('/notificacoes/ler-todas', null, { params: { userId } })
  },

  limpar: async (userId: string): Promise<void> => {
    await apiClient.patch('/notificacoes/limpar', null, { params: { userId } })
  },
}