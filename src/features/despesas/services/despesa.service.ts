import { apiClient } from '@/shared/api'
import type { DespesaRequest, DespesaResponse } from '../types/despesa.types'

export const despesaService = {
  listar: async (dataInicio?: string, dataFim?: string): Promise<DespesaResponse[]> => {
    const { data } = await apiClient.get<DespesaResponse[]>('/despesas', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  criar: async (request: DespesaRequest): Promise<DespesaResponse> => {
    const { data } = await apiClient.post<DespesaResponse>('/despesas', request)
    return data
  },

  atualizar: async (id: string, request: DespesaRequest): Promise<DespesaResponse> => {
    const { data } = await apiClient.put<DespesaResponse>(`/despesas/${id}`, request)
    return data
  },

  remover: async (id: string): Promise<void> => {
    await apiClient.delete(`/despesas/${id}`)
  },
}
