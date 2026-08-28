import { apiClient } from '@/shared/api'
import type { FinanceiroDashboardData, DashboardQueryParams } from '../types/dashboard.types'
import type { Receita, ReceitaQueryParams, ReceitaRequest } from '../types/receita.types'
import type { FluxoCaixaData, FluxoCaixaQueryParams } from '../types/fluxo-caixa.types'
import type {
  ResumoMensalRelatorio,
  DespesasCategoriaRelatorio,
  InadimplenciaRelatorio,
  RentabilidadeServicoRelatorio,
  RentabilidadeClienteRelatorio,
  ComparativoRelatorio,
  RelatorioFiscal,
} from '../types/relatorio.types'

export interface FinanceiroResumo {
  totalEntradas: number
  totalFinal: number
  totalExtras: number
  faturamentoTotal: number
  despesasDeslocamento: number
  despesasComissao: number
  despesasRepasse: number
  despesasManuais: number
}

export interface RelatoriosTotais {
  total: number
  entrada: number
  restante: number
  extras: number
  totalFinal: number
  repasses: number
  comissao: number
}

export interface RelatorioAgendamentoItem {
  id: string
  clienteNome: string
  pacoteNome: string | null
  valorTotal: number
  valorEntradaPago: number
  valorRestante: number
  valorExtras: number
  valorTotalFinal: number
  dataHoraEnsaio: string | null
  status: string
}

export interface FinanceiroRelatorios {
  totais: RelatoriosTotais
  agendamentos: RelatorioAgendamentoItem[]
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

  dashboard: async (params?: DashboardQueryParams): Promise<FinanceiroDashboardData> => {
    const { data } = await apiClient.get<FinanceiroDashboardData>('/financeiro/dashboard', { params })
    return data
  },

  // ---- Receitas ----

  listarReceitas: async (params?: ReceitaQueryParams): Promise<Receita[]> => {
    const { data } = await apiClient.get<Receita[]>('/financeiro/receitas', { params })
    return data
  },

  buscarReceita: async (id: string): Promise<Receita> => {
    const { data } = await apiClient.get<Receita>(`/financeiro/receitas/${id}`)
    return data
  },

  criarReceita: async (request: ReceitaRequest): Promise<Receita> => {
    const { data } = await apiClient.post<Receita>('/financeiro/receitas', request)
    return data
  },

  atualizarReceita: async (id: string, request: ReceitaRequest): Promise<Receita> => {
    const { data } = await apiClient.put<Receita>(`/financeiro/receitas/${id}`, request)
    return data
  },

  excluirReceita: async (id: string): Promise<void> => {
    await apiClient.delete(`/financeiro/receitas/${id}`)
  },

  receberReceita: async (id: string): Promise<Receita> => {
    const { data } = await apiClient.patch<Receita>(`/financeiro/receitas/${id}/receber`)
    return data
  },

  duplicarReceita: async (id: string): Promise<Receita> => {
    const { data } = await apiClient.post<Receita>(`/financeiro/receitas/${id}/duplicar`)
    return data
  },

  // ---- Fluxo de caixa ----

  fluxoCaixa: async (params?: FluxoCaixaQueryParams): Promise<FluxoCaixaData> => {
    const { data } = await apiClient.get<FluxoCaixaData>('/financeiro/fluxo-caixa', { params })
    return data
  },

  // ---- Relatórios ----

  relatorioResumoMensal: async (dataInicio: string, dataFim: string): Promise<ResumoMensalRelatorio> => {
    const { data } = await apiClient.get<ResumoMensalRelatorio>('/financeiro/relatorios/resumo-mensal', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  relatorioDespesasCategoria: async (dataInicio: string, dataFim: string): Promise<DespesasCategoriaRelatorio> => {
    const { data } = await apiClient.get<DespesasCategoriaRelatorio>('/financeiro/relatorios/despesas-categoria', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  relatorioInadimplencia: async (dataInicio?: string, dataFim?: string): Promise<InadimplenciaRelatorio> => {
    const { data } = await apiClient.get<InadimplenciaRelatorio>('/financeiro/relatorios/inadimplencia', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  relatorioRentabilidadeServico: async (dataInicio: string, dataFim: string): Promise<RentabilidadeServicoRelatorio[]> => {
    const { data } = await apiClient.get<RentabilidadeServicoRelatorio[]>('/financeiro/relatorios/rentabilidade-servico', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  relatorioRentabilidadeCliente: async (dataInicio: string, dataFim: string): Promise<RentabilidadeClienteRelatorio> => {
    const { data } = await apiClient.get<RentabilidadeClienteRelatorio>('/financeiro/relatorios/rentabilidade-cliente', {
      params: { dataInicio, dataFim },
    })
    return data
  },

  relatorioComparativo: async (tipo: string, dataInicio: string, dataFim: string): Promise<ComparativoRelatorio> => {
    const { data } = await apiClient.get<ComparativoRelatorio>('/financeiro/relatorios/comparativo', {
      params: { tipo, dataInicio, dataFim },
    })
    return data
  },

  relatorioFiscal: async (dataInicio: string, dataFim: string): Promise<RelatorioFiscal> => {
    const { data } = await apiClient.get<RelatorioFiscal>('/financeiro/relatorios/fiscal', {
      params: { dataInicio, dataFim },
    })
    return data
  },
}
