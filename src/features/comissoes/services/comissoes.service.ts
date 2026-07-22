import { apiClient } from '@/shared/api'
import type { ConsultaComissoesResponse, IndicadorListagem } from '../types'

export const comissoesService = {
  consultar: async (telefone: string): Promise<ConsultaComissoesResponse> => {
    const { data } = await apiClient.get<ConsultaComissoesResponse>('/comissoes/consulta', {
      params: { telefone },
    })
    return data
  },

  listarIndicadores: async (): Promise<IndicadorListagem[]> => {
    const { data } = await apiClient.get<IndicadorListagem[]>('/comissoes/indicadores')
    return data
  },
}