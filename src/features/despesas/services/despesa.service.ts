import { apiClient } from '@/shared/api'
import type {
  DespesaCategoria,
  DespesaCategoriaRequest,
  DespesaQueryParams,
  DespesaRequest,
  DespesaResponse,
} from '../types/despesa.types'

export const despesaService = {
  listar: async (params?: DespesaQueryParams): Promise<DespesaResponse[]> => {
    const { data } = await apiClient.get<DespesaResponse[]>('/despesas', { params })
    return data
  },

  buscarPorId: async (id: string): Promise<DespesaResponse> => {
    const { data } = await apiClient.get<DespesaResponse>(`/despesas/${id}`)
    return data
  },

  criar: async (request: DespesaRequest): Promise<DespesaResponse> => {
    const { data } = await apiClient.post<DespesaResponse>('/despesas', request)
    return data
  },

  atualizar: async (id: string, request: DespesaRequest): Promise<DespesaResponse> => {
    const { data } = await apiClient.put<DespesaResponse>(`/despesas/${id}`, request)
    return data
  },

  remover: async (id: string): Promise<void> => {
    await apiClient.delete(`/despesas/${id}`)
  },

  pagar: async (id: string): Promise<DespesaResponse> => {
    const { data } = await apiClient.patch<DespesaResponse>(`/despesas/${id}/pagar`)
    return data
  },

  uploadComprovante: async (id: string, arquivo: File): Promise<DespesaResponse> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const { data } = await apiClient.post<DespesaResponse>(`/despesas/${id}/comprovante`, formData)
    return data
  },

  recorrentesProximas: async (dias = 7): Promise<DespesaResponse[]> => {
    const { data } = await apiClient.get<DespesaResponse[]>('/despesas/recorrentes-proximas', {
      params: { dias },
    })
    return data
  },

  listarCategorias: async (ativas = true): Promise<DespesaCategoria[]> => {
    const { data } = await apiClient.get<DespesaCategoria[]>('/despesas/categorias', {
      params: { ativas },
    })
    return data
  },

  criarCategoria: async (request: DespesaCategoriaRequest): Promise<DespesaCategoria> => {
    const { data } = await apiClient.post<DespesaCategoria>('/despesas/categorias', request)
    return data
  },

  atualizarCategoria: async (id: string, request: DespesaCategoriaRequest): Promise<DespesaCategoria> => {
    const { data } = await apiClient.put<DespesaCategoria>(`/despesas/categorias/${id}`, request)
    return data
  },

  removerCategoria: async (id: string): Promise<void> => {
    await apiClient.delete(`/despesas/categorias/${id}`)
  },
}
