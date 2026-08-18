import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/shared/constants'
import { apiClient } from '@/shared/api/client'

export interface Parceiro {
  id: string
  nome: string
  email: string
  telefone?: string
  papel: string
  ativo: boolean
}

export async function listarParceiros() {
  const { data } = await apiClient.get<Parceiro[]>('/parceiros')
  return data
}

export function useParceirosList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'parceiros'],
    queryFn: listarParceiros,
  })
}
