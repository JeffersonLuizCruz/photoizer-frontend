import { apiClient } from '@/shared/api'
import type { EdicaoProcesso, FotoEdicao } from '../types'

export const edicaoService = {
  list: async (status?: string): Promise<EdicaoProcesso[]> => {
    const params = status ? { status } : undefined
    const { data } = await apiClient.get<EdicaoProcesso[]>('/edicao', { params })
    return data
  },

  obterStatus: async (agendamentoId: string): Promise<EdicaoProcesso | null> => {
    const { data } = await apiClient.get<EdicaoProcesso>(`/edicao/${agendamentoId}`)
    return data
  },

  listarFotos: async (agendamentoId: string): Promise<FotoEdicao[]> => {
    const { data } = await apiClient.get<FotoEdicao[]>(`/edicao/${agendamentoId}/fotos`)
    return data
  },

  uploadRaw: async (agendamentoId: string, arquivos: File[]): Promise<FotoEdicao[]> => {
    const formData = new FormData()
    arquivos.forEach((file) => formData.append('arquivos', file))
    const { data } = await apiClient.post<FotoEdicao[]>(`/edicao/${agendamentoId}/raw`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  uploadRawWithProgress: async (
    agendamentoId: string,
    arquivos: File[],
    onProgress?: (progress: number) => void,
  ): Promise<FotoEdicao[]> => {
    const formData = new FormData()
    arquivos.forEach((file) => formData.append('arquivos', file))
    const { data } = await apiClient.post<FotoEdicao[]>(`/edicao/${agendamentoId}/raw`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total))
        }
      },
    })
    return data
  },

  uploadEditadas: async (agendamentoId: string, arquivos: File[]): Promise<FotoEdicao[]> => {
    const formData = new FormData()
    arquivos.forEach((file) => formData.append('arquivos', file))
    const { data } = await apiClient.post<FotoEdicao[]>(`/edicao/${agendamentoId}/editadas`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  concluirEdicao: async (agendamentoId: string): Promise<EdicaoProcesso> => {
    const { data } = await apiClient.patch<EdicaoProcesso>(`/edicao/${agendamentoId}/concluir`)
    return data
  },

  publicarNoEcommerce: async (agendamentoId: string): Promise<FotoEdicao[]> => {
    const { data } = await apiClient.patch<FotoEdicao[]>(`/edicao/${agendamentoId}/publicar`)
    return data
  },

  deletarFoto: async (fotoId: string): Promise<void> => {
    await apiClient.delete(`/edicao/fotos/${fotoId}`)
  },

  atualizarObservacoes: async (agendamentoId: string, observacoes: string): Promise<EdicaoProcesso> => {
    const { data } = await apiClient.patch<EdicaoProcesso>(`/edicao/${agendamentoId}/observacoes`, { observacoes })
    return data
  },

  reordenarFotos: async (fotos: { id: string; ordem: number }[]): Promise<FotoEdicao[]> => {
    const { data } = await apiClient.patch<FotoEdicao[]>('/edicao/fotos/reordenar', fotos)
    return data
  },
}
