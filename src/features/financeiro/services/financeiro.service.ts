import { apiClient } from '@/shared/api'
import type { Agendamento } from '@/features/agenda/types'

export interface FinanceiroResumo {
  totalEntradas: number
  totalFinal: number
  totalExtras: number
  faturamentoTotal: number
}

export interface RelatoriosTotais {
  total: number
  entrada: number
  restante: number
  extras: number
  totalFinal: number
}

export interface FinanceiroRelatorios {
  totais: RelatoriosTotais
  agendamentos: Agendamento[]
  quantidade: number
}

export const financeiroService = {
  resumo: async (dataInicio?: string, dataFim?: string): Promise<FinanceiroResumo> => {
    const { data } = await apiClient.get<FinanceiroResumo>('/financeiro/resumo', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  relatorios: async (dataInicio?: string, dataFim?: string): Promise<FinanceiroRelatorios> => {
    const { data } = await apiClient.get<FinanceiroRelatorios>('/financeiro/relatorios', {
      params: { dataInicio, dataFim },
    })
    return data
  },
}
