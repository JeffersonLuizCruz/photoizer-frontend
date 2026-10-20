import { apiClient } from '@/shared/api'
import type { BloqueioAgenda, BloqueioAgendaPayload } from '../types'

export const bloqueioService = {
  list: async (dataInicio: string, dataFim: string, profissionalId?: string): Promise<BloqueioAgenda[]> => {
    const { data } = await apiClient.get<BloqueioAgenda[]>('/bloqueios', {
      params: { dataInicio, dataFim, profissionalId },
    })
    return data
  },

  create: async (payload: BloqueioAgendaPayload): Promise<BloqueioAgenda> => {
    const { data } = await apiClient.post<BloqueioAgenda>('/bloqueios', payload)
    return data
  },

  update: async (id: string, payload: BloqueioAgendaPayload): Promise<BloqueioAgenda> => {
    const { data } = await apiClient.put<BloqueioAgenda>(`/bloqueios/${id}`, payload)
    return data
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/bloqueios/${id}`)
  },
}
