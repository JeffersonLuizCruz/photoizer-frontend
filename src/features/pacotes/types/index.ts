import type { AuditInfo } from '@/shared/types'

export interface UsuarioRef {
  id: string
  nome: string
  email: string
  papel: string
}

export interface Pacote {
  id: string
  auditInfo: AuditInfo
  nome: string
  descricao: string
  quantidadeFotos: number
  quantidadeVideos: number
  valorBase: number
  bloqueiaDiaInteiro: boolean
  duracaoEstimada: string
  ativo: boolean
  diasParaEntrega: number | null
}
