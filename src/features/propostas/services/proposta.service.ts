import { apiClient } from '@/shared/api'
import type { PaginatedResponse } from '@/shared/types'
import type { AgendamentoStatus } from '@/shared/constants'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import { coletarDadosDispositivo } from '@/shared/lib/device'
import type {
  DisponibilidadeResponse,
  IndicadorOption,
  NovaPropostaPayload,
  PacoteOption,
  Proposta,
  PropostaPublica,
  PropostaStatusPublico,
  UsuarioOption,
} from '../types'
import type { AssinarPropostaFormValues } from '../schemas/proposta.schema'

const STATUS_PROPOSTA: AgendamentoStatus[] = [
  AGENDAMENTO_STATUS.PRE_RESERVA,
  AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO,
  AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO,
]

export const propostaService = {
  listPacotes: async (): Promise<PacoteOption[]> => {
    const { data } = await apiClient.get<PacoteOption[]>('/pacotes/all')
    return data
  },

  listUsuarios: async (): Promise<UsuarioOption[]> => {
    const { data } = await apiClient.get<UsuarioOption[]>('/users')
    return data
  },

  listIndicadores: async (search?: string): Promise<IndicadorOption[]> => {
    const params = search ? { search } : undefined
    const { data: response } = await apiClient.get<PaginatedResponse<IndicadorOption>>('/indicadores', { params })
    return response.data
  },

  verificarDisponibilidade: async (
    data: string,
    hora: string,
    duracaoMinutos: number,
    bloqueiaDiaInteiro: boolean,
    fotografoId?: string,
  ): Promise<DisponibilidadeResponse> => {
    const params: Record<string, string | number | boolean> = { data, hora, duracaoMinutos, bloqueiaDiaInteiro }
    if (fotografoId) params.fotografoId = fotografoId
    const { data: result } = await apiClient.get<DisponibilidadeResponse>('/agendamentos/verificar-disponibilidade', {
      params,
    })
    return result
  },

  listarPropostas: async (): Promise<Proposta[]> => {
    const { data } = await apiClient.get<Proposta[]>('/agendamentos')
    return data
      .filter((a) => STATUS_PROPOSTA.includes(a.status))
      .sort((a, b) => new Date(b.dataHoraEnsaio).getTime() - new Date(a.dataHoraEnsaio).getTime())
  },

  criarProposta: async (payload: NovaPropostaPayload): Promise<Proposta> => {
    const { data } = await apiClient.post<Proposta>('/agendamentos/proposta', payload)
    return data
  },

  confirmarPagamento: async (id: string): Promise<Proposta> => {
    const { data } = await apiClient.patch<Proposta>(`/agendamentos/${id}/confirmar-pagamento`)
    return data
  },

  aprovar: async (id: string): Promise<Proposta> => {
    const { data } = await apiClient.patch<Proposta>(`/agendamentos/${id}/aprovar`)
    return data
  },

  recusar: async (id: string, motivo: string): Promise<Proposta> => {
    const { data } = await apiClient.patch<Proposta>(`/agendamentos/${id}/recusar`, { motivo })
    return data
  },

  carregarPublico: async (token: string): Promise<PropostaPublica> => {
    const { data } = await apiClient.get<PropostaPublica>(`/propostas/publico/${token}`)
    return data
  },

  statusPublico: async (token: string): Promise<PropostaStatusPublico> => {
    const { data } = await apiClient.get<PropostaStatusPublico>(`/propostas/publico/${token}/status`)
    return data
  },

  async assinar(
    token: string,
    valores: AssinarPropostaFormValues,
    comprovante: File | undefined,
    assinaturaImagem: Blob | null,
  ): Promise<PropostaStatusPublico> {
    const formData = new FormData()
    formData.append('nome', valores.nome)
    formData.append('telefone', valores.telefone)
    if (valores.email) formData.append('email', valores.email)
    formData.append('cpf', valores.cpf)
    if (valores.cidade) formData.append('cidade', valores.cidade)
    if (valores.estado) formData.append('estado', valores.estado)
    formData.append('autorizaUsoImagem', valores.autorizaUsoImagem)
    formData.append('assinatura', valores.assinatura)
    if (!comprovante) throw new Error('Comprovante de pagamento da reserva é obrigatório')
    formData.append('comprovante', comprovante)
    if (!assinaturaImagem) throw new Error('A assinatura (desenho) é obrigatória')
    formData.append('assinaturaImagem', assinaturaImagem, 'assinatura.png')

    const dispositivo = coletarDadosDispositivo()
    formData.append('userAgent', dispositivo.userAgent)
    formData.append('plataforma', dispositivo.plataforma)
    formData.append('fusoHorario', dispositivo.fusoHorario)

    const { data } = await apiClient.post<PropostaStatusPublico>(`/propostas/publico/${token}/assinar`, formData)
    return data
  },
}
