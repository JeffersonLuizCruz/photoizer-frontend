export type StatusEdicao = 'AGUARDANDO_RAW' | 'RAW_ENVIADOS' | 'EM_EDICAO' | 'EDICAO_CONCLUIDA'

export type StatusFotoEdicao = 'RAW' | 'EM_EDICAO' | 'EDITADO'

export interface EdicaoProcesso {
  id: string
  agendamentoId: string
  status: StatusEdicao
  fotografoId: string | null
  editorId: string | null
  dataEnvioRaw: string | null
  dataEnvioEditado: string | null
  observacoes: string | null
  totalFotosRaw: number
  totalFotosEditadas: number
  createdAt: string
  updatedAt: string
}

export interface FotoEdicao {
  id: string
  edicaoId: string
  rawFileName: string
  rawDownloadUrl: string
  rawPreviewUrl: string
  editedFileName: string | null
  editedDownloadUrl: string | null
  editedPreviewUrl: string | null
  status: StatusFotoEdicao
  ordem: number
  createdAt: string
}

export interface ZipJob {
  jobId: string
  status: string
  downloadUrl: string
}
