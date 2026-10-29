import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { galeriaResumoQueryKey } from '@/shared/constants'
import { ecommerceService } from '../services/ecommerce.service'
import type { EtapaGaleria } from '../types/ecommerce.types'

export interface GaleriaPipelineFiltros {
  etapa?: EtapaGaleria
  busca?: string
  atrasadas?: boolean
  semFotos?: boolean
  page?: number
  perPage?: number
}

export const GALERIA_PIPELINE_KEYS = {
  fila: (filtros: GaleriaPipelineFiltros) => ['galeria-pipeline', filtros] as const,
  desempenho: (meses: number) => ['galeria-desempenho', meses] as const,
}

export function useGaleriaPipeline(filtros: GaleriaPipelineFiltros) {
  return useQuery({
    queryKey: GALERIA_PIPELINE_KEYS.fila(filtros),
    queryFn: () => ecommerceService.adminGaleriaPipeline(filtros),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useGaleriaPipelineResumo(userId?: string, papel?: string | null) {
  return useQuery({
    queryKey: galeriaResumoQueryKey(userId, papel),
    queryFn: () => ecommerceService.adminGaleriaPipelineResumo(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useGaleriaPerformance(meses: number) {
  return useQuery({
    queryKey: GALERIA_PIPELINE_KEYS.desempenho(meses),
    queryFn: () => ecommerceService.adminGaleriaPerformance(meses),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
