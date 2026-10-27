import { useQuery } from '@tanstack/react-query'
import { ecommerceService } from '../services/ecommerce.service'
import type { EtapaGaleria } from '../types/ecommerce.types'

export interface GaleriaPipelineFiltros {
  etapa?: EtapaGaleria
  busca?: string
  atrasadas?: boolean
  page?: number
  perPage?: number
}

export const GALERIA_PIPELINE_KEYS = {
  fila: (filtros: GaleriaPipelineFiltros) => ['galeria-pipeline', filtros] as const,
  resumo: ['galeria-pipeline-resumo'] as const,
}

export function useGaleriaPipeline(filtros: GaleriaPipelineFiltros) {
  return useQuery({
    queryKey: GALERIA_PIPELINE_KEYS.fila(filtros),
    queryFn: () => ecommerceService.adminGaleriaPipeline(filtros),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useGaleriaPipelineResumo() {
  return useQuery({
    queryKey: GALERIA_PIPELINE_KEYS.resumo,
    queryFn: () => ecommerceService.adminGaleriaPipelineResumo(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
