import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/shared/constants'
import { dashboardService } from '../services/dashboard.service'

export function useFinanceiroMensal(meses = 6) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD, 'financeiro-mensal', meses],
    queryFn: () => dashboardService.financeiroMensal(meses),
    staleTime: 1000 * 60 * 2,
  })
}

export function useDashboardEcommerce() {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD, 'ecommerce'],
    queryFn: () => dashboardService.ecommerce(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useDashboardEcommerceMensal(meses = 6) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD, 'ecommerce-mensal', meses],
    queryFn: () => dashboardService.ecommerceMensal(meses),
    staleTime: 1000 * 60 * 2,
  })
}
