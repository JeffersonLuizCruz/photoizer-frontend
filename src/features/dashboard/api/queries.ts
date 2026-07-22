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
