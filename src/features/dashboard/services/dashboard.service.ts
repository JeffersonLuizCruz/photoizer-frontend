import { apiClient } from '@/shared/api'

export interface DadosMensais {
  mes: string
  totalAgendamentos: number
  valorConfirmados: number
  valorFinalizados: number
  despesasDeslocamento: number
  despesasComissao: number
  despesasManuais: number
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
  despesasComissao: number
  despesasManuais: number
  saldoLiquido: number
  receitaProjetada: number
  liquidoAtual: number
  liquidoPrevisto: number
}

export interface DashboardMensalResponse {
  mesAtual: ResumoMesAtual
  historico: DadosMensais[]
}

export interface TopCliente {
  nomeCliente: string
  telefoneCliente: string
  quantidadeCompras: number
  totalGasto: number
}

export interface DashboardEcommerceResponse {
  totalCompras: number
  totalFotosExtras: number
  totalFaturado: number
  ticketMedio: number
  topClientes: TopCliente[]
}

export interface DadosEcommerceMensal {
  mes: string
  quantidadeCompras: number
  quantidadeFotos: number
  valorTotal: number
}

export interface DashboardEcommerceMensalResponse {
  historico: DadosEcommerceMensal[]
}

export const dashboardService = {
  financeiroMensal: async (meses = 6): Promise<DashboardMensalResponse> => {
    const { data } = await apiClient.get<DashboardMensalResponse>('/dashboard/financeiro-mensal', {
      params: { meses },
    })
    return data
  },

  ecommerce: async (): Promise<DashboardEcommerceResponse> => {
    const { data } = await apiClient.get<DashboardEcommerceResponse>('/dashboard/ecommerce')
    return data
  },

  ecommerceMensal: async (meses = 6): Promise<DashboardEcommerceMensalResponse> => {
    const { data } = await apiClient.get<DashboardEcommerceMensalResponse>('/dashboard/ecommerce/mensal', {
      params: { meses },
    })
    return data
  },
}
