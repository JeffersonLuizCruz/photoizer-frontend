import { apiClient } from '@/shared/api'
import { env } from '@/shared/config/env'
import type { FotoEnsaio, FotoComentario, ComentariosPorFotoResponse } from '../types/foto.types'
import type { AgendamentoStatus } from '@/shared/constants'

export interface AgendamentoRef {
  id: string
  tokenGaleria: string
  status: AgendamentoStatus
  clienteNome?: string | null
  pacoteNome?: string | null
  dataHoraEnsaio?: string | null
  localEnsaio?: string | null
}

/**
 * Orçamento por requisição de upload.
 *
 * O envio de um ensaio inteiro (2 GB+) numa única requisição estoura o
 * `client_max_body_size` do Nginx e os timeouts do proxy/navegador. Cada lote
 * fica bem abaixo dos 200 MB do backend e termina em poucos segundos.
 */
const UPLOAD_LOTE_MAX_BYTES = 50 * 1024 * 1024
const UPLOAD_LOTE_MAX_ARQUIVOS = 5

export interface UploadProgress {
  loteAtual: number
  totalLotes: number
  /** Fotos de lotes já concluídos. */
  arquivosConcluidos: number
  /** Quantidade de fotos no lote em andamento. */
  arquivosNoLote: number
  /** Progresso do envio do lote atual (0..1). */
  percentualLote: number
  totalArquivos: number
}

/**
 * Erro de upload que preserva o que já foi enviado e o que ainda falta.
 * Permite que a tela mantenha selecionados apenas os arquivos não enviados
 * (evita duplicar fotos quando a staff tenta novamente).
 */
export class UploadLoteError extends Error {
  readonly enviadas: FotoEnsaio[]
  readonly restantes: File[]
  readonly lote: number
  readonly totalLotes: number
  readonly causa: unknown

  constructor(
    message: string,
    enviadas: FotoEnsaio[],
    restantes: File[],
    lote: number,
    totalLotes: number,
    causa: unknown,
  ) {
    super(message)
    this.name = 'UploadLoteError'
    this.enviadas = enviadas
    this.restantes = restantes
    this.lote = lote
    this.totalLotes = totalLotes
    this.causa = causa
  }
}

export function dividirEmLotes(arquivos: File[]): File[][] {
  const lotes: File[][] = []
  let loteAtual: File[] = []
  let bytesAtual = 0

  for (const arquivo of arquivos) {
    const excedeBytes = bytesAtual + arquivo.size > UPLOAD_LOTE_MAX_BYTES
    const excedeArquivos = loteAtual.length >= UPLOAD_LOTE_MAX_ARQUIVOS

    if (loteAtual.length > 0 && (excedeBytes || excedeArquivos)) {
      lotes.push(loteAtual)
      loteAtual = []
      bytesAtual = 0
    }

    loteAtual.push(arquivo)
    bytesAtual += arquivo.size
  }

  if (loteAtual.length > 0) {
    lotes.push(loteAtual)
  }

  return lotes
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

  upload: async (
    agendamentoId: string,
    arquivos: File[],
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<FotoEnsaio[]> => {
    const lotes = dividirEmLotes(arquivos)
    const enviadas: FotoEnsaio[] = []

    for (let indice = 0; indice < lotes.length; indice++) {
      const lote = lotes[indice]
      const formData = new FormData()
      lote.forEach((file) => formData.append('arquivos', file))

      const notificar = (percentualLote: number) => {
        onProgress?.({
          loteAtual: indice + 1,
          totalLotes: lotes.length,
          arquivosConcluidos: enviadas.length,
          arquivosNoLote: lote.length,
          percentualLote,
          totalArquivos: arquivos.length,
        })
      }

      notificar(0)

      try {
        const { data } = await apiClient.post<FotoEnsaio[]>(
          `/agendamentos/${agendamentoId}/fotos`,
          formData,
          {
            timeout: env.VITE_UPLOAD_TIMEOUT,
            onUploadProgress: (evento) => {
              const percentual = evento.total ? evento.loaded / evento.total : 0
              notificar(Math.min(1, Math.max(0, percentual)))
            },
          },
        )
        enviadas.push(...data)
      } catch (error) {
        throw new UploadLoteError(
          'Falha ao enviar lote de fotos',
          [...enviadas],
          lotes.slice(indice).flat(),
          indice + 1,
          lotes.length,
          error,
        )
      }
    }

    return enviadas
  },

  publicar: async (agendamentoId: string): Promise<FotoEnsaio[]> => {
    const { data } = await apiClient.patch<FotoEnsaio[]>(`/agendamentos/${agendamentoId}/fotos/publicar`)
    return data
  },

  renumerar: async (agendamentoId: string): Promise<FotoEnsaio[]> => {
    const { data } = await apiClient.post<FotoEnsaio[]>(`/agendamentos/${agendamentoId}/fotos/renumerar`)
    return data
  },

  deletar: async (agendamentoId: string, fotoId: string): Promise<void> => {
    await apiClient.delete(`/agendamentos/${agendamentoId}/fotos/${fotoId}`)
  },

  removerEmLote: async (agendamentoId: string, fotoIds: string[]): Promise<{ removidas: number }> => {
    const { data } = await apiClient.post<{ removidas: number }>(
      `/agendamentos/${agendamentoId}/fotos/remover-lote`,
      { fotoIds },
    )
    return data
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

  uploadEditada: async (agendamentoId: string, fotoId: string, arquivo: File): Promise<FotoEnsaio> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const { data } = await apiClient.put<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/editada`,
      formData,
      { timeout: env.VITE_UPLOAD_TIMEOUT },
    )
    return data
  },

  /**
   * Reenvia a edição de uma foto já entregue, quando o cliente pede um ajuste.
   * A nova versão substitui a anterior e fica disponível para download.
   */
  uploadReedicao: async (agendamentoId: string, fotoId: string, arquivo: File): Promise<FotoEnsaio> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const { data } = await apiClient.put<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/reedicao`,
      formData,
      { timeout: env.VITE_UPLOAD_TIMEOUT },
    )
    return data
  },

  /** Edição sob demanda de uma foto extra comprada após a publicação. */
  uploadEditadaCompraExtra: async (agendamentoId: string, fotoId: string, arquivo: File): Promise<FotoEnsaio> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const { data } = await apiClient.put<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/editada-compra`,
      formData,
      { timeout: env.VITE_UPLOAD_TIMEOUT },
    )
    return data
  },

  /** Libera o download da versão editada de uma foto extra comprada. */
  publicarEditadaCompraExtra: async (agendamentoId: string, fotoId: string): Promise<FotoEnsaio> => {
    const { data } = await apiClient.post<FotoEnsaio>(
      `/agendamentos/${agendamentoId}/fotos/${fotoId}/editada-compra/publicar`,
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
