import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/shared/constants'
import { financeiroService } from '../services/financeiro.service'

export function useFinanceiroResumo(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'resumo', dataInicio, dataFim],
    queryFn: () => financeiroService.resumo(dataInicio, dataFim),
    staleTime: 1000 * 60 * 2,
  })
}

export function useFinanceiroRelatorios(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'relatorios', dataInicio, dataFim],
    queryFn: () => financeiroService.relatorios(dataInicio, dataFim),
  })
}
