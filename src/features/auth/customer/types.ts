export interface CustomerUser {
  id: string
  nome: string
  email: string
  telefone: string
  token: string
  isLoggedIn: boolean
}

export interface AgendamentoCliente {
  id: string
  pacoteNome: string
  pacoteQuantidadeFotos: number
  pacoteQuantidadeVideos: number
  precoFotoExtra: number
  dataHoraEnsaio: string
  status: string
  statusDescricao: string
  tokenGaleria: string
  localEnsaio: string
  totalFotosPublicadas: number
  fotosSelecionadasPacote: number
  fotosPagas: number
}
