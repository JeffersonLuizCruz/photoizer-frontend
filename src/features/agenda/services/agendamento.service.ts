import { apiClient } from '@/shared/api'
import { parseDuracao } from '@/shared/lib/duracao'
import type { Agendamento, ExtraServicoResponse, Pacote, Pagamento, Usuario, FinanceiroTrabalho, Reatribuicao } from '../types'
import type { AgendamentoStatus, FormaPagamento } from '@/shared/constants'
import type { EditarAgendamentoFormData } from '../schemas/agendamento.schema'

export { parseDuracao }

export interface Config {
  valorUnitarioFotoExtra: number
  valorUnitarioVideoExtra: number
  percentualComissao: number
  percentualEntrada: number
  taxaDeslocamentoPadrao: number
}

export interface FinanceiroPreview {
  valorTotal: number
  valorEntradaExigido: number
  valorRestante: number
  valorTotalFinal: number
  percentualEntrada: number
}

export interface DisponibilidadeResponse {
  disponivel: boolean
  conflitos: Array<{
    agendamentoId: string
    horario: string
    clienteNome: string
  }>
}

export const agendamentoService = {
  getConfig: async (): Promise<Config> => {
    const { data } = await apiClient.get<Config>('/config')
    return {
      valorUnitarioFotoExtra: Number(data.valorUnitarioFotoExtra) || 0,
      valorUnitarioVideoExtra: Number(data.valorUnitarioVideoExtra) || 0,
      percentualComissao: Number(data.percentualComissao) || 0,
      percentualEntrada: Number(data.percentualEntrada) || 0,
      taxaDeslocamentoPadrao: Number(data.taxaDeslocamentoPadrao) || 0,
    }
  },

  previewFinanceiro: async (pacoteId: string, taxaDeslocamento: number): Promise<FinanceiroPreview> => {
    const { data } = await apiClient.post<FinanceiroPreview>('/financeiro/preview', null, {
      params: { pacoteId, taxaDeslocamento },
    })
    return data
  },

  listPacotes: async (): Promise<Pacote[]> => {
    const { data } = await apiClient.get<Pacote[]>('/pacotes/all')
    return data
  },

  listUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await apiClient.get<Usuario[]>('/users')
    return data
  },

  list: async (params?: {
    status?: AgendamentoStatus
    editorId?: string
    dataInicio?: string
    dataFim?: string
    search?: string
  }): Promise<Agendamento[]> => {
    const { data } = await apiClient.get<Agendamento[]>('/agendamentos', { params })
    return data
  },

  getById: async (id: string): Promise<Agendamento> => {
    const { data } = await apiClient.get<Agendamento>(`/agendamentos/${id}`)
    return data
  },

  update: async (id: string, payload: EditarAgendamentoFormData): Promise<Agendamento> => {
    const { data } = await apiClient.put<Agendamento>(`/agendamentos/${id}`, payload)
    return data
  },

  listarPagamentos: async (agendamentoId: string): Promise<Pagamento[]> => {
    const { data } = await apiClient.get<Pagamento[]>(`/financeiro/agendamentos/${agendamentoId}/pagamentos`)
    return data
  },

  resumoFinanceiro: async (agendamentoId: string): Promise<FinanceiroTrabalho> => {
    const { data } = await apiClient.get<FinanceiroTrabalho>(`/financeiro/agendamentos/${agendamentoId}/financeiro`)
    return data
  },

  vincularDespesa: async (despesaId: string, agendamentoId: string | null): Promise<void> => {
    await apiClient.patch(`/despesas/${despesaId}/agendamento`, { agendamentoId })
  },

  confirmarPagamento: async (id: string): Promise<Agendamento> => {
    const { data } = await apiClient.patch<Agendamento>(`/agendamentos/${id}/confirmar-pagamento`)
    return data
  },

  aprovar: async (id: string): Promise<Agendamento> => {
    const { data } = await apiClient.patch<Agendamento>(`/agendamentos/${id}/aprovar`)
    return data
  },

  updateStatus: async (id: string, status: AgendamentoStatus): Promise<Agendamento> => {
    const { data } = await apiClient.patch<Agendamento>(`/agendamentos/${id}/status`, { status })
    return data
  },

  reagendar: async (id: string, data: string, hora: string): Promise<Agendamento> => {
    const params = new URLSearchParams()
    params.append('data', data)
    params.append('hora', hora)
    const { data: result } = await apiClient.patch<Agendamento>(`/agendamentos/${id}/reagendar?${params.toString()}`)
    return result
  },

  toggleDestaque: async (id: string): Promise<Agendamento> => {
    const { data } = await apiClient.patch<Agendamento>(`/agendamentos/${id}/destaque`)
    return data
  },

  addFotoExtra: async (
    agendamentoId: string,
    payload: { quantidade: number; valorUnitario: number; indicadorId?: string; indicadorNome?: string; indicadorTelefone?: string },
  ): Promise<ExtraServicoResponse> => {
    const { data } = await apiClient.post<ExtraServicoResponse>(`/financeiro/agendamentos/${agendamentoId}/fotos-extras`, null, { params: payload })
    return data
  },

  addVideoExtra: async (
    agendamentoId: string,
    payload: { quantidade: number; valorUnitario: number; indicadorId?: string; indicadorNome?: string; indicadorTelefone?: string },
  ): Promise<ExtraServicoResponse> => {
    const { data } = await apiClient.post<ExtraServicoResponse>(`/financeiro/agendamentos/${agendamentoId}/videos-extras`, null, { params: payload })
    return data
  },

  verificarDisponibilidade: async (
    data: string,
    hora: string,
    duracaoMinutos: number,
    bloqueiaDiaInteiro: boolean,
    fotografoId?: string,
    excluirAgendamentoId?: string,
  ): Promise<DisponibilidadeResponse> => {
    const params: Record<string, string | number | boolean> = { data, hora, duracaoMinutos, bloqueiaDiaInteiro }
    if (fotografoId) params.fotografoId = fotografoId
    if (excluirAgendamentoId) params.excluirAgendamentoId = excluirAgendamentoId
    const { data: result } = await apiClient.get<DisponibilidadeResponse>('/agendamentos/verificar-disponibilidade', {
      params,
    })
    return result
  },

  reatribuirFotografo: async (
    id: string,
    payload: { fotografoId: string; motivo?: string },
  ): Promise<Agendamento> => {
    const { data } = await apiClient.patch<Agendamento>(`/agendamentos/${id}/fotografo`, payload)
    return data
  },

  listarReatribuicoes: async (id: string): Promise<Reatribuicao[]> => {
    const { data } = await apiClient.get<Reatribuicao[]>(`/agendamentos/${id}/reatribuicoes`)
    return data
  },

  registrarPagamentoFinal: async (
    id: string,
    comprovante?: File,
    formaPagamento?: FormaPagamento,
  ): Promise<Agendamento> => {
    const formData = new FormData()
    if (comprovante) {
      formData.append('comprovanteFinal', comprovante)
    }
    if (formaPagamento) {
      formData.append('formaPagamento', formaPagamento)
    }
    const { data } = await apiClient.post<Agendamento>(`/agendamentos/${id}/pagamento-final`, formData)
    return data
  },

}
