import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { QUERY_KEYS } from '@/shared/constants'
import { financeiroService } from '../services/financeiro.service'
import type { DashboardQueryParams } from '../types/dashboard.types'
import type { ReceitaQueryParams, ReceitaRequest } from '../types/receita.types'
import type { FluxoCaixaQueryParams } from '../types/fluxo-caixa.types'

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

export function useFinanceiroDashboard(params?: DashboardQueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'dashboard', params],
    queryFn: () => financeiroService.dashboard(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function useReceitasList(params?: ReceitaQueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'receitas', 'list', params],
    queryFn: () => financeiroService.listarReceitas(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function useFluxoCaixa(params?: FluxoCaixaQueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'fluxo-caixa', params],
    queryFn: () => financeiroService.fluxoCaixa(params),
    staleTime: 1000 * 60 * 2,
  })
}

function relatorioQuery<T>(key: string[], fn: () => Promise<T>, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'relatorios', ...key],
    queryFn: fn,
    enabled,
  })
}

export function useRelatorioResumoMensal(dataInicio: string, dataFim: string, enabled = true) {
  return relatorioQuery(
    ['resumo-mensal', dataInicio, dataFim],
    () => financeiroService.relatorioResumoMensal(dataInicio, dataFim),
    enabled,
  )
}

export function useRelatorioDespesasCategoria(dataInicio: string, dataFim: string, enabled = true) {
  return relatorioQuery(
    ['despesas-categoria', dataInicio, dataFim],
    () => financeiroService.relatorioDespesasCategoria(dataInicio, dataFim),
    enabled,
  )
}

export function useRelatorioInadimplencia(dataInicio?: string, dataFim?: string, enabled = true) {
  return relatorioQuery(
    ['inadimplencia', dataInicio ?? '', dataFim ?? ''],
    () => financeiroService.relatorioInadimplencia(dataInicio, dataFim),
    enabled,
  )
}

export function useRelatorioRentabilidadeServico(dataInicio: string, dataFim: string, enabled = true) {
  return relatorioQuery(
    ['rentabilidade-servico', dataInicio, dataFim],
    () => financeiroService.relatorioRentabilidadeServico(dataInicio, dataFim),
    enabled,
  )
}

export function useRelatorioRentabilidadeCliente(dataInicio: string, dataFim: string, enabled = true) {
  return relatorioQuery(
    ['rentabilidade-cliente', dataInicio, dataFim],
    () => financeiroService.relatorioRentabilidadeCliente(dataInicio, dataFim),
    enabled,
  )
}

export function useRelatorioComparativo(tipo: 'MENSAL' | 'ANUAL', dataInicio: string, dataFim: string, enabled = true) {
  return relatorioQuery(
    ['comparativo', tipo, dataInicio, dataFim],
    () => financeiroService.relatorioComparativo(tipo, dataInicio, dataFim),
    enabled,
  )
}

export function useRelatorioFiscal(dataInicio: string, dataFim: string, enabled = true) {
  return relatorioQuery(
    ['fiscal', dataInicio, dataFim],
    () => financeiroService.relatorioFiscal(dataInicio, dataFim),
    enabled,
  )
}

interface ClienteOpcao {
  id: string
  nome: string
  telefone?: string
}

export function useClientesSearch(search: string) {
  return useQuery({
    queryKey: ['clientes', 'search', search],
    queryFn: async (): Promise<ClienteOpcao[]> => {
      const { data } = await apiClient.get<{ data: Array<{ id: string; nome: string; telefone?: string }> }>('/clientes', {
        params: { search, perPage: 20 },
      })
      return data.data.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone }))
    },
    enabled: search.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

interface ClienteOpcao {
  id: string
  nome: string
  telefone?: string
}

export function useConfigFinanceiro() {
  return useQuery({
    queryKey: ['config', 'financeiro'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ percentualComissao?: number }>('/config')
      return { percentualComissao: Number(data.percentualComissao) || 10 }
    },
    staleTime: 1000 * 60 * 5,
  })
}

function invalidateFinanceiro(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
}

export function useCriarReceita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ReceitaRequest) => financeiroService.criarReceita(request),
    onSuccess: () => invalidateFinanceiro(queryClient),
  })
}

export function useAtualizarReceita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ReceitaRequest }) =>
      financeiroService.atualizarReceita(id, request),
    onSuccess: () => invalidateFinanceiro(queryClient),
  })
}

export function useExcluirReceita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.excluirReceita(id),
    onSuccess: () => invalidateFinanceiro(queryClient),
  })
}

export function useReceberReceita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.receberReceita(id),
    onSuccess: () => invalidateFinanceiro(queryClient),
  })
}

export function useDuplicarReceita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.duplicarReceita(id),
    onSuccess: () => invalidateFinanceiro(queryClient),
  })
}
