import { apiClient } from '@/shared/api'
import type { FotoEnsaio, FotoComentario, ComentariosPorFotoResponse } from '../types/foto.types'
import type { AgendamentoStatus } from '@/shared/constants'

interface AgendamentoRef {
  id: string
  tokenGaleria: string
  status: AgendamentoStatus
}

export const fotoService = {
  getAgendamento: async (id: string): Promise<AgendamentoRef> => {
    const { data } = await apiClient.get<AgendamentoRef>(`/agendamentos/${id}`)
    return data
  },
  listar: async (agendamentoId: string): Promise<FotoEnsaio[]> => {
    const { data } = await apiClient.get<FotoEnsaio[]>(`/agendamentos/${agendamentoId}/fotos`)
    return data
  },

  upload: async (agendamentoId: string, arquivos: File[]): Promise<FotoEnsaio[]> => {
    const formData = new FormData()
    arquivos.forEach((file) => formData.append('arquivos', file))
    const { data } = await apiClient.post<FotoEnsaio[]>(`/agendamentos/${agendamentoId}/fotos`, formData)
    return data
  },

  publicar: async (agendamentoId: string): Promise<FotoEnsaio[]> => {
    const { data } = await apiClient.patch<FotoEnsaio[]>(`/agendamentos/${agendamentoId}/fotos/publicar`)
    return data
  },

  deletar: async (agendamentoId: string, fotoId: string): Promise<void> => {
    await apiClient.delete(`/agendamentos/${agendamentoId}/fotos/${fotoId}`)
  },

  alterarVisibilidade: async (agendamentoId: string, fotoId: string, visivel: boolean): Promise<FotoEnsaio> => {
    const { data } = await apiClient.patch<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/visibilidade`,
      null,
      { params: { visivel } }
    )
    return data
  },

  alterarStatus: async (agendamentoId: string, fotoId: string, status: string): Promise<FotoEnsaio> => {
    const { data } = await apiClient.patch<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/status`,
      null,
      { params: { status } }
    )
    return data
  },

  substituirImagem: async (agendamentoId: string, fotoId: string, arquivo: File): Promise<FotoEnsaio> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const { data } = await apiClient.put<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/imagem`,
      formData
    )
    return data
  },

  atualizarMetadata: async (agendamentoId: string, fotoId: string, metadata: {
    titulo?: string
    tags?: string[]
    categoria?: string
    destaque?: boolean
  }): Promise<FotoEnsaio> => {
    const { data } = await apiClient.patch<FotoEnsaio>(`/agendamentos/${agendamentoId}/fotos/${fotoId}/metadata`, metadata)
    return data
  },

  // Comentários dos clientes nas fotos
  listarComentarios: async (agendamentoId: string): Promise<ComentariosPorFotoResponse[]> => {
    const { data } = await apiClient.get<ComentariosPorFotoResponse[]>(`/ecommerce/admin/comentarios/agendamentos/${agendamentoId}`)
    return data
  },

  responderComentario: async (agendamentoId: string, fotoId: string, mensagem: string): Promise<FotoComentario> => {
    const { data } = await apiClient.post<FotoComentario>(
      `/ecommerce/admin/comentarios/agendamentos/${agendamentoId}/fotos/${fotoId}/comentarios`,
      { mensagem }
    )
    return data
  },

  marcarComentariosLidos: async (agendamentoId: string, fotoId: string): Promise<void> => {
    await apiClient.patch(`/ecommerce/admin/comentarios/agendamentos/${agendamentoId}/fotos/${fotoId}/comentarios/lidas`)
  },
}
