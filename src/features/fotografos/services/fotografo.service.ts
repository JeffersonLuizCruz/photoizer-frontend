import { apiClient } from '@/shared/api'
import type { Fotografo, FotografoDashboardResponse, FotografoEnsaiosResponse, FotografoResumoFinanceiroResponse, FotografoRelatorioGlobalResponse, AgendamentoFotografo } from '../types'
import type { DespesaResponse } from '@/features/despesas/types/despesa.types'

export interface CriarFotografoData {
  nome: string
  email: string
  senha: string
  telefone?: string
}

export interface AtualizarFotografoData {
  nome: string
  email: string
  telefone?: string
}

export interface FotografoRepasseInput {
  fotografoId?: string
  valorRepassar?: number
  tipoValor?: 'FIXO' | 'PERCENTUAL'
  percentual?: number
}

export const fotografoService = {
  listar: async (): Promise<Fotografo[]> => {
    const { data } = await apiClient.get<Fotografo[]>('/fotografos')
    return data
  },

  listarParceiros: async (): Promise<Fotografo[]> => {
    const { data } = await apiClient.get<Fotografo[]>('/parceiros')
    return data
  },

  getById: async (id: string): Promise<Fotografo> => {
    const { data } = await apiClient.get<Fotografo>(`/fotografos/${id}`)
    return data
  },

  criar: async (payload: CriarFotografoData): Promise<Fotografo> => {
    const { data } = await apiClient.post<Fotografo>('/fotografos', payload)
    return data
  },

  atualizar: async (id: string, payload: AtualizarFotografoData): Promise<Fotografo> => {
    const { data } = await apiClient.put<Fotografo>(`/fotografos/${id}`, payload)
    return data
  },

  toggleStatus: async (id: string): Promise<void> => {
    await apiClient.patch(`/fotografos/${id}/status`)
  },

  remover: async (id: string): Promise<void> => {
    await apiClient.delete(`/fotografos/${id}`)
  },

  dashboard: async (id: string): Promise<FotografoDashboardResponse> => {
    const { data } = await apiClient.get<FotografoDashboardResponse>(`/fotografos/${id}/dashboard`)
    return data
  },

  listarEnsaios: async (id: string): Promise<FotografoEnsaiosResponse[]> => {
    const { data } = await apiClient.get<FotografoEnsaiosResponse[]>(`/fotografos/${id}/ensaios`)
    return data
  },

  resumoFinanceiro: async (id: string): Promise<FotografoResumoFinanceiroResponse> => {
    const { data } = await apiClient.get<FotografoResumoFinanceiroResponse>(`/fotografos/${id}/resumo-financeiro`)
    return data
  },

  listarCustos: async (id: string): Promise<DespesaResponse[]> => {
    const { data } = await apiClient.get<DespesaResponse[]>(`/fotografos/${id}/custos`)
    return data
  },

  relatorioGlobal: async (): Promise<FotografoRelatorioGlobalResponse> => {
    const { data } = await apiClient.get<FotografoRelatorioGlobalResponse>('/fotografos/relatorio-global')
    return data
  },

  exportarCsv: async (id: string): Promise<void> => {
    const response = await apiClient.get(`/fotografos/${id}/financeiro/csv`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const contentDisposition = response.headers['content-disposition']
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ?? 'financas-fotografo.csv'
      : 'financas-fotografo.csv'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  listarFotografosDoEnsaio: async (agendamentoId: string): Promise<AgendamentoFotografo[]> => {
    const { data } = await apiClient.get<AgendamentoFotografo[]>(`/agendamentos/${agendamentoId}/fotografos`)
    return data
  },

  adicionarFotografoAoEnsaio: async (agendamentoId: string, payload: FotografoRepasseInput): Promise<AgendamentoFotografo> => {
    const { data } = await apiClient.post<AgendamentoFotografo>(`/agendamentos/${agendamentoId}/fotografos`, payload)
    return data
  },

  atualizarRepasse: async (agendamentoId: string, fotografoId: string, payload: FotografoRepasseInput): Promise<AgendamentoFotografo> => {
    const { data } = await apiClient.put<AgendamentoFotografo>(`/agendamentos/${agendamentoId}/fotografos/${fotografoId}`, payload)
    return data
  },

  removerFotografoDoEnsaio: async (agendamentoId: string, fotografoId: string): Promise<void> => {
    await apiClient.delete(`/agendamentos/${agendamentoId}/fotografos/${fotografoId}`)
  },

  pagarRepasse: async (agendamentoId: string, fotografoId: string): Promise<AgendamentoFotografo> => {
    const { data } = await apiClient.patch<AgendamentoFotografo>(`/agendamentos/${agendamentoId}/fotografos/${fotografoId}/pagar`)
    return data
  },

  listarRepassesPendentes: async (fotografoId?: string): Promise<AgendamentoFotografo[]> => {
    const params = fotografoId ? { fotografoId } : {}
    const { data } = await apiClient.get<AgendamentoFotografo[]>('/repasses/pendentes', { params })
    return data
  },

  pagarRepasseLote: async (ids: string[]): Promise<AgendamentoFotografo[]> => {
    const { data } = await apiClient.post<AgendamentoFotografo[]>('/repasses/pagar-lote', ids)
    return data
  },
}