import { apiClient } from '@/shared/api'
import type { ContratoStatus } from '@/shared/constants'
import type {
  Contrato,
  CriarContratoPayload,
  DisponibilidadeResponse,
  IndicadorOption,
  PacoteOption,
  PublicarContratoResponse,
  UsuarioOption,
} from '../types'

export const contratoService = {
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
    const { data } = await apiClient.get<IndicadorOption[]>('/indicadores', { params })
    return data
  },

  verificarDisponibilidade: async (
    data: string,
    hora: string,
    duracaoMinutos: number,
    bloqueiaDiaInteiro: boolean,
  ): Promise<DisponibilidadeResponse> => {
    const { data: result } = await apiClient.get<DisponibilidadeResponse>('/agendamentos/verificar-disponibilidade', {
      params: { data, hora, duracaoMinutos, bloqueiaDiaInteiro },
    })
    return result
  },

  listar: async (params?: { status?: ContratoStatus; search?: string }): Promise<Contrato[]> => {
    const { data } = await apiClient.get<Contrato[]>('/contratos', { params })
    return data
  },

  buscar: async (id: string): Promise<Contrato> => {
    const { data } = await apiClient.get<Contrato>(`/contratos/${id}`)
    return data
  },

  criar: async (payload: CriarContratoPayload): Promise<Contrato> => {
    const { data } = await apiClient.post<Contrato>('/contratos', payload)
    return data
  },

  publicar: async (id: string): Promise<PublicarContratoResponse> => {
    const { data } = await apiClient.post<PublicarContratoResponse>(`/contratos/${id}/publicar`)
    return data
  },

  confirmarPagamento: async (id: string): Promise<Contrato> => {
    const { data } = await apiClient.post<Contrato>(`/contratos/${id}/confirmar-pagamento`)
    return data
  },

  aprovar: async (id: string): Promise<Contrato> => {
    const { data } = await apiClient.post<Contrato>(`/contratos/${id}/aprovar`)
    return data
  },

  devolver: async (id: string, payload: { tipoMotivo?: string; motivo: string }): Promise<Contrato> => {
    const { data } = await apiClient.post<Contrato>(`/contratos/${id}/devolver`, payload)
    return data
  },

  cancelar: async (id: string): Promise<Contrato> => {
    const { data } = await apiClient.post<Contrato>(`/contratos/${id}/cancelar`)
    return data
  },

  getTemplate: async (): Promise<string> => {
    const { data } = await apiClient.get<{ template: string }>('/contrato/template')
    return data.template
  },

  updateTemplate: async (template: string): Promise<void> => {
    await apiClient.put('/contrato/template', { template })
  },

  restaurarTemplatePadrao: async (): Promise<string> => {
    const { data } = await apiClient.put<{ template: string }>('/contrato/template/padrao')
    return data.template
  },

  async baixarArquivo(id: string, tipo: 'pdf' | 'comprovante'): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/contratos/${id}/${tipo}`, { responseType: 'blob' })
    return data
  },
}

export function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}