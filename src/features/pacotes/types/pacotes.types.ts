import type { AuditInfo } from '@/shared/types'

export interface PacoteResponse {
  id: string
  auditInfo: AuditInfo
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
  diasParaEntrega: number | null
}
