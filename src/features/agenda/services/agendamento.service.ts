import { format } from 'date-fns'
import { apiClient } from '@/shared/api'
import type { Agendamento, FotoExtra, VideoExtra, Pacote, Pagamento, Usuario } from '../types'
import type { WizardFormValues } from '../schemas/agendamento.schema'
import type { AgendamentoStatus } from '@/shared/constants'
import type { Cliente } from '@/features/clientes/types'
import type { EditarAgendamentoFormData } from '../schemas/agendamento.schema'

export interface RascunhoAgendamentoData {
  clienteId?: string
  nome?: string
  telefone?: string
  email?: string
  cpf?: string
  cidade?: string
  estado?: string
  origem?: string
  pacoteId?: string
  data?: string
  hora?: string
  localEnsaio?: string
  enderecoCompleto?: string
  editorId?: string
  custoDeslocamento?: number
  repassarDeslocamento?: boolean
  autorizaUsoImagem?: boolean
  indicadorId?: string
  indicadorNome?: string
  indicadorTelefone?: string
  observacoes?: string
  currentStep?: number
  comprovanteName?: string | null
  confirmado?: boolean
}

export interface Config {
  valorUnitarioFotoExtra: number
  valorUnitarioVideoExtra: number
  percentualComissao: number
  percentualEntrada: number
  taxaDeslocamentoPadrao: number
  notificarAutomaticamente: number
}

export interface FinanceiroPreview {
  valorTotal: number
  valorEntradaExigido: number
  valorRestante: number
  valorTotalFinal: number
  percentualEntrada: number
}

export const agendamentoService = {
  getConfig: async (): Promise<Config> => {
    const { data } = await apiClient.get<Config>('/config')
    return data
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

  buscarClientePorTelefone: async (telefone: string): Promise<Cliente | null> => {
    const { data } = await apiClient.get<{ data: Cliente[] }>('/clientes', {
      params: { search: telefone, perPage: 1 },
    })
    return data.data.length > 0 ? data.data[0] : null
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
    const taxaDeslocamento = payload.repassarDeslocamento ? payload.custoDeslocamento : 0
    const { data } = await apiClient.put<Agendamento>(`/agendamentos/${id}`, {
      ...payload,
      taxaDeslocamento,
    })
    return data
  },

  listarPagamentos: async (agendamentoId: string): Promise<Pagamento[]> => {
    const { data } = await apiClient.get<Pagamento[]>(`/financeiro/agendamentos/${agendamentoId}/pagamentos`)
    return data
  },

  createFromWizard: async (
    payload: WizardFormValues,
    comprovante?: File,
  ): Promise<Agendamento> => {
    const formData = new FormData()

    if (payload.clienteId) {
      formData.append('clienteId', payload.clienteId)
    }
    formData.append('nome', payload.nome)
    formData.append('telefone', payload.telefone)
    if (payload.email) formData.append('email', payload.email)
    if (payload.cpf) formData.append('cpf', payload.cpf)
    if (payload.cidade) formData.append('cidade', payload.cidade)
    if (payload.estado) formData.append('estado', payload.estado)
    if (payload.origem) formData.append('origem', payload.origem)

    formData.append('pacoteId', payload.pacoteId)
    formData.append('data', format(payload.data, 'yyyy-MM-dd'))
    formData.append('hora', payload.hora)
    formData.append('localEnsaio', payload.localEnsaio)
    if (payload.enderecoCompleto) formData.append('enderecoCompleto', payload.enderecoCompleto)
    if (payload.editorId) formData.append('editorId', payload.editorId)
    const taxaDeslocamento = payload.repassarDeslocamento ? payload.custoDeslocamento : 0
    formData.append('taxaDeslocamento', String(taxaDeslocamento))
    formData.append('custoDeslocamento', String(payload.custoDeslocamento))
    formData.append('repassarDeslocamento', String(payload.repassarDeslocamento))
    formData.append('autorizaUsoImagem', String(payload.autorizaUsoImagem))

    if (payload.indicadorId) formData.append('indicadorId', payload.indicadorId)
    if (payload.indicadorNome) formData.append('indicadorNome', payload.indicadorNome)
    if (payload.indicadorTelefone) formData.append('indicadorTelefone', payload.indicadorTelefone)

    if (payload.observacoes) formData.append('observacoes', payload.observacoes)
    if (comprovante) formData.append('comprovanteEntrada', comprovante)

    const { data } = await apiClient.post<Agendamento>('/agendamentos', formData)
    return data
  },

  salvarRascunho: async (data: RascunhoAgendamentoData): Promise<RascunhoAgendamentoData> => {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    const { data: result } = await apiClient.post<RascunhoAgendamentoData>('/rascunhos', null, { params })
    return result
  },

  buscarRascunho: async (): Promise<RascunhoAgendamentoData | null> => {
    try {
      const { data } = await apiClient.get<RascunhoAgendamentoData>('/rascunhos/meu')
      return data
    } catch {
      return null
    }
  },

  deletarRascunho: async (): Promise<void> => {
    await apiClient.delete('/rascunhos/meu')
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
  ): Promise<FotoExtra> => {
    const { data } = await apiClient.post<FotoExtra>(`/financeiro/agendamentos/${agendamentoId}/fotos-extras`, null, { params: payload })
    return data
  },

  addVideoExtra: async (
    agendamentoId: string,
    payload: { quantidade: number; valorUnitario: number; indicadorId?: string; indicadorNome?: string; indicadorTelefone?: string },
  ): Promise<VideoExtra> => {
    const { data } = await apiClient.post<VideoExtra>(`/financeiro/agendamentos/${agendamentoId}/videos-extras`, null, { params: payload })
    return data
  },

  registrarPagamentoFinal: async (
    id: string,
    comprovante?: File,
  ): Promise<Agendamento> => {
    const formData = new FormData()
    if (comprovante) {
      formData.append('comprovanteFinal', comprovante)
    }
    const { data } = await apiClient.post<Agendamento>(`/agendamentos/${id}/pagamento-final`, formData)
    return data
  },

}
