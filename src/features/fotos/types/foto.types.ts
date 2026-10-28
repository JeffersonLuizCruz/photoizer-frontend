export type { FotoEnsaio, FotoComentario, ComentariosPorFotoResponse, OrigemComentario } from '@/features/ecommerce/types/ecommerce.types'

export interface AquecerPreviasResponse {
  total: number
  geradas: number
  reaproveitadas: number
  falhas: number
  ignoradas: number
}
