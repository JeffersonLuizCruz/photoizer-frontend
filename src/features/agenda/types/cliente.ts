import type { AuditInfo } from '@/shared/types'

export type Origem = 'INDICACAO' | 'ANUNCIO' | 'OUTROS'

export interface Cliente {
  id: string
  auditInfo: AuditInfo
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  cidade: string | null
  estado: string | null
  origem: Origem
  observacoes: string | null
}
