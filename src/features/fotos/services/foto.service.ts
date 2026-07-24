import { apiClient } from '@/shared/api'
import type { FotoEnsaio } from '../types/foto.types'
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

  atualizarMetadata: async (agendamentoId: string, fotoId: string, metadata: {
    titulo?: string
    tags?: string[]
    categoria?: string
    destaque?: boolean
  }): Promise<FotoEnsaio> => {
    const { data } = await apiClient.patch<FotoEnsaio>(`/agendamentos/${agendamentoId}/fotos/${fotoId}/metadata`, metadata)
    return data
  },
}
