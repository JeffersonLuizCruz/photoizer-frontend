/**
 * Resumo do diretório de uploads, compartilhado entre a página de
 * armazenamento e o card do dashboard.
 */
export interface ArmazenamentoResumo {
  bytesFotos: number
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
