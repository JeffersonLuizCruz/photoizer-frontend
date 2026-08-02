export interface UsuarioRef {
  id: string
  nome: string
  email: string
  papel: string
}

export interface Pacote {
  id: string
  nome: string
  descricao: string
  quantidadeFotos: number
  quantidadeVideos: number
  valorBase: number
  bloqueiaDiaInteiro: boolean
  duracaoEstimada: string
  ativo: boolean
  diasParaEntrega: number | null
  createdAt: string
  updatedAt: string
}
