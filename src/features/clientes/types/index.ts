import type { ClienteFormData } from '../schemas/cliente.schema'

export type Origem = 'INDICACAO' | 'ANUNCIO' | 'OUTROS'

export interface Cliente {
  id: string
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  cidade: string | null
  estado: string | null
  origem: Origem
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ClienteListParams {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ClienteListResponse {
  data: Cliente[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export type ClienteCreatePayload = ClienteFormData
export type ClienteUpdatePayload = ClienteFormData
