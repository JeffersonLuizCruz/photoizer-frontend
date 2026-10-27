export type MotivoExpurgoBloqueado = 'NAO_FINALIZADO' | 'JA_ARQUIVADA' | 'PENDENCIA' | 'SEM_FOTOS'

export type { ArmazenamentoResumo } from '@/shared/types/armazenamento'

export interface GaleriaArmazenamento {
  agendamentoId: string
  clienteNome: string | null
  dataHoraEnsaio: string | null
  status: string | null
  quantidadeFotos: number
  quantidadeArquivadas: number
  bytes: number
  bytesFotos: number
  bytesDocumentos: number
  ultimoDownload: string | null
  arquivada: boolean
  arquivadaEm: string | null
  bytesLiberados: number
  expurgavel: boolean
  motivoBloqueio: MotivoExpurgoBloqueado | null
}

export interface ExpurgoResultado {
  fotos: number
  bytesLiberados: number
}

export interface LimparOrfaosResultado {
  arquivos: number
  bytesLiberados: number
}

export interface ArquivoOrfao {
  caminho: string
  bytes: number
  modificadoEm: string | null
  reconhecido: boolean
  elegivel: boolean
}

export interface ArquivosOrfaos {
  total: number
  bytes: number
  elegiveis: number
  bytesElegiveis: number
  desconhecidos: number
  listados: number
  truncado: boolean
  arquivos: ArquivoOrfao[]
}

export interface SnapshotArmazenamento {
  data: string
  bytesFotos: number
  bytesDerivados: number
  bytesEditadas: number
  bytesDocumentos: number
  bytesPropostas: number
  bytesOutros: number
  bytesTotal: number
  volumeTotal: number
  volumeLivre: number
  totalFotos: number
  totalGalerias: number
  galeriasArquivadas: number
  fotosArquivadas: number
  bytesLiberadosNoDia: number
  coletadoEm: string
}

export interface HistoricoArmazenamento {
  dias: number
  snapshots: SnapshotArmazenamento[]
}

export const MOTIVO_BLOQUEIO_LABEL: Record<MotivoExpurgoBloqueado, string> = {
  NAO_FINALIZADO: 'Finalize o ensaio para liberar o expurgo',
  JA_ARQUIVADA: 'Galeria já arquivada',
  PENDENCIA: 'Há seleção ativa ou compra pendente',
  SEM_FOTOS: 'Galeria sem fotos cadastradas',
}
