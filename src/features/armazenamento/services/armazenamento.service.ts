import { apiClient } from '@/shared/api'
import { env } from '@/shared/config/env'
import type {
  ArquivosOrfaos,
  ArmazenamentoResumo,
  ExpurgoResultado,
  GaleriaArmazenamento,
  HistoricoArmazenamento,
  LimparOrfaosResultado,
  SnapshotArmazenamento,
} from '../types/armazenamento.types'

export const armazenamentoService = {
  resumo: async (): Promise<ArmazenamentoResumo> => {
    const { data } = await apiClient.get<ArmazenamentoResumo>('/admin/armazenamento/resumo')
    return data
  },

  galerias: async (): Promise<GaleriaArmazenamento[]> => {
    const { data } = await apiClient.get<GaleriaArmazenamento[]>('/admin/armazenamento/galerias')
    return data
  },

  galeria: async (agendamentoId: string): Promise<GaleriaArmazenamento> => {
    const { data } = await apiClient.get<GaleriaArmazenamento>(
      `/admin/armazenamento/galerias/${agendamentoId}`,
    )
    return data
  },

  expurgar: async (agendamentoId: string): Promise<ExpurgoResultado> => {
    const { data } = await apiClient.post<ExpurgoResultado>(
      `/admin/armazenamento/galerias/${agendamentoId}/expurgar`,
    )
    return data
  },

  manifestoUrl: (agendamentoId: string): string =>
    `${env.VITE_API_URL}/admin/armazenamento/galerias/${agendamentoId}/manifesto`,

  orfaos: async (): Promise<ArquivosOrfaos> => {
    const { data } = await apiClient.get<ArquivosOrfaos>('/admin/armazenamento/orfaos')
    return data
  },

  limparOrfaos: async (): Promise<LimparOrfaosResultado> => {
    const { data } = await apiClient.post<LimparOrfaosResultado>('/admin/armazenamento/orfaos/limpar')
    return data
  },

  historico: async (dias = 30): Promise<HistoricoArmazenamento> => {
    const { data } = await apiClient.get<HistoricoArmazenamento>('/admin/armazenamento/historico', {
      params: { dias },
    })
    return data
  },

  coletarHistorico: async (): Promise<SnapshotArmazenamento> => {
    const { data } = await apiClient.post<SnapshotArmazenamento>(
      '/admin/armazenamento/historico/coletar',
    )
    return data
  },
}
