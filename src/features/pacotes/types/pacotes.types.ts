export interface PacoteResponse {
  id: string
  nome: string
  descricao: string | null
  quantidadeFotos: number
  quantidadeVideos: number
  valorBase: number
  precoFotoExtra: number
  imagemCapa: string | null
  beneficios: string | null
  valorTotalMinimo: number
  duracaoEstimada: string | null
  bloqueiaDiaInteiro: boolean
  ativo: boolean
  fotografoId: string | null
  fotografoNome: string | null
  editorResponsavelId: string | null
  editorResponsavelNome: string | null
  diasParaEntrega: number | null
  createdAt: string
  updatedAt: string
}
