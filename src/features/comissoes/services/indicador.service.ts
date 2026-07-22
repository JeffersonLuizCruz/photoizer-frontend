import { apiClient } from '@/shared/api'
import type { IndicadorRequest, IndicadorResponse } from '../types'

export const indicadorService = {
  listar: async (search?: string): Promise<IndicadorResponse[]> => {
    const params = search ? { search } : undefined
    const { data } = await apiClient.get<IndicadorResponse[]>('/indicadores', { params })
    return data
  },

  criar: async (payload: IndicadorRequest): Promise<IndicadorResponse> => {
    const { data } = await apiClient.post<IndicadorResponse>('/indicadores', payload)
    return data
  },

  atualizar: async (id: string, payload: IndicadorRequest): Promise<IndicadorResponse> => {
    const { data } = await apiClient.put<IndicadorResponse>(`/indicadores/${id}`, payload)
    return data
  },

  remover: async (id: string): Promise<void> => {
    await apiClient.delete(`/indicadores/${id}`)
  },
}