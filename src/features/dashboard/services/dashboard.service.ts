import { apiClient } from '@/shared/api'

export interface DadosMensais {
  mes: string
  totalAgendamentos: number
  valorConfirmados: number
  valorFinalizados: number
  despesasDeslocamento: number
  entradasRecebidas: number
  liquidoAtual: number
  liquidoPrevisto: number
}

export interface ResumoMesAtual {
  totalAgendamentos: number
  confirmados: number
  valorTotalConfirmados: number
  entradasRecebidas: number
  saldoRestante: number
  finalizados: number
  valorTotalFinalizados: number
  despesasDeslocamento: number
  saldoLiquido: number
  receitaProjetada: number
  liquidoAtual: number
  liquidoPrevisto: number
}

export interface DashboardMensalResponse {
  mesAtual: ResumoMesAtual
  historico: DadosMensais[]
}

export const dashboardService = {
  financeiroMensal: async (meses = 6): Promise<DashboardMensalResponse> => {
    const { data } = await apiClient.get<DashboardMensalResponse>('/dashboard/financeiro-mensal', {
      params: { meses },
    })
    return data
  },
}
