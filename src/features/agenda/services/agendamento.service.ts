import { format } from 'date-fns'
import { apiClient } from '@/shared/api'
import type { Agendamento, FotoExtra, Pacote, Pagamento, Tarefa, Usuario } from '../types'
import type { WizardFormValues } from '../schemas/agendamento.schema'
import type { AgendamentoStatus, TarefaStatus, TarefaTipo } from '@/shared/constants'
import type { Cliente } from '@/features/clientes/types'
import type { EditarAgendamentoFormData } from '../schemas/agendamento.schema'

export const agendamentoService = {
  listPacotes: async (): Promise<Pacote[]> => {
    const { data } = await apiClient.get<Pacote[]>('/pacotes')
    return data
  },

  listUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await apiClient.get<Usuario[]>('/usuarios')
    return data
  },

  buscarClientePorTelefone: async (telefone: string): Promise<Cliente | null> => {
    const { data } = await apiClient.get<Cliente[]>('/clientes', {
      params: { search: telefone, perPage: 1 },
    })
    return data.length > 0 ? data[0] : null
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
    formData.append('taxaDeslocamento', String(payload.taxaDeslocamento))
    formData.append('autorizaUsoImagem', String(payload.autorizaUsoImagem))

    if (payload.observacoes) formData.append('observacoes', payload.observacoes)
    if (comprovante) formData.append('comprovanteEntrada', comprovante)

    const { data } = await apiClient.post<Agendamento>('/agendamentos', formData)
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
    payload: { quantidade: number; valorUnitario: number },
  ): Promise<FotoExtra> => {
    const { data } = await apiClient.post<FotoExtra>(`/agendamentos/${agendamentoId}/fotos-extras`, payload)
    return data
  },

  registrarPagamentoFinal: async (
    id: string,
    comprovante?: File,
  ): Promise<Agendamento> => {
    if (comprovante) {
      const formData = new FormData()
      formData.append('comprovanteFinal', comprovante)
      const { data } = await apiClient.post<Agendamento>(`/agendamentos/${id}/pagamento-final`, formData)
      return data
    }
    const { data } = await apiClient.post<Agendamento>(`/agendamentos/${id}/pagamento-final`)
    return data
  },

  listTarefas: async (agendamentoId?: string): Promise<Tarefa[]> => {
    const params = agendamentoId ? { agendamentoId } : undefined
    const { data } = await apiClient.get<Tarefa[]>('/tarefas', { params })
    return data
  },

  createTarefa: async (payload: {
    agendamentoId: string
    tipo: TarefaTipo
    responsavelId?: string | null
    dataLimite: string
  }): Promise<Tarefa> => {
    const { data } = await apiClient.post<Tarefa>('/tarefas', payload)
    return data
  },

  updateTarefaStatus: async (id: string, status: TarefaStatus): Promise<Tarefa> => {
    const { data } = await apiClient.patch<Tarefa>(`/tarefas/${id}/status`, { status })
    return data
  },
}
