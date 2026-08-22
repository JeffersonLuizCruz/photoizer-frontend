import type { AuditInfo } from '@/shared/types'

export type StatusEdicao = 'AGUARDANDO_RAW' | 'RAW_ENVIADOS' | 'EM_EDICAO' | 'EDICAO_CONCLUIDA'

export type StatusFotoEdicao = 'RAW' | 'EDITADO'

export interface EdicaoProcesso {
  id: string
  auditInfo: AuditInfo
  agendamentoId: string
  status: StatusEdicao
  fotografoId: string | null
  fotografoNome: string | null
  editorId: string | null
  editorNome: string | null
  dataEnvioRaw: string | null
  dataEnvioEditado: string | null
  observacoes: string | null
  totalFotosRaw: number
  totalFotosEditadas: number
}

export interface FotoEdicao {
  id: string
  auditInfo: AuditInfo
  edicaoId: string
  rawFileName: string
  rawDownloadUrl: string
  rawPreviewUrl: string
  editedFileName: string | null
  editedDownloadUrl: string | null
  editedPreviewUrl: string | null
  status: StatusFotoEdicao
  ordem: number
  aprovado: boolean | null
  comentario: string | null
}
