export type MotivoExpurgoBloqueado = 'NAO_FINALIZADO' | 'JA_ARQUIVADA' | 'PENDENCIA' | 'SEM_FOTOS'

export interface ArmazenamentoResumo {  bytesFotos: number
  bytesDerivados: number
  bytesEditadas: number
  bytesDocumentos: number
  bytesPropostas: number
  bytesOutros: number
  bytesTotal: number
  volumeTotal: number
  volumeLivre: number
  percentualUso: number
  totalGalerias: number
  totalFotos: number
  galeriasArquivadas: number
  bytesLiberados: number
}

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

export const MOTIVO_BLOQUEIO_LABEL: Record<MotivoExpurgoBloqueado, string> = {
  NAO_FINALIZADO: 'Finalize o ensaio para liberar o expurgo',
  JA_ARQUIVADA: 'Galeria já arquivada',
  PENDENCIA: 'Há seleção ativa ou compra pendente',
  SEM_FOTOS: 'Galeria sem fotos cadastradas',
}
