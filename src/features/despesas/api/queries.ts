import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiClient } from '@/shared/api'
import { QUERY_KEYS } from '@/shared/constants'
import { despesaService } from '../services/despesa.service'
import type {
  DespesaCategoriaRequest,
  DespesaQueryParams,
  DespesaRequest,
} from '../types/despesa.types'

const despesasKey = ['despesas']

interface AgendamentoOpcao {
  id: string
  label: string
}

export function useAgendamentosOpcoes(): {
  data?: AgendamentoOpcao[]
  isLoading: boolean
} {
  return useQuery({
    queryKey: ['agenda', 'opcoes-despesas'],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<{ id: string; clienteNome?: string; dataHoraEnsaio?: string; pacoteNome?: string; status?: string }>>('/agendamentos')
      return data
        .filter((a) => a.status !== 'CANCELADO' && a.status !== 'NO_SHOW')
        .map((a) => ({
          id: a.id,
          label: `${a.clienteNome ?? 'Sem cliente'} — ${a.dataHoraEnsaio ? format(new Date(a.dataHoraEnsaio), 'dd/MM/yyyy', { locale: ptBR }) : ''}${a.pacoteNome ? ` · ${a.pacoteNome}` : ''}`,
        }))
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useDespesasList(params?: DespesaQueryParams) {
  return useQuery({
    queryKey: [...despesasKey, 'list', params],
    queryFn: () => despesaService.listar(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function useDespesasCategorias(ativas = true) {
  return useQuery({
    queryKey: [...despesasKey, 'categorias', ativas],
    queryFn: () => despesaService.listarCategorias(ativas),
    staleTime: 1000 * 60 * 5,
  })
}

export function useDespesasRecorrentes(dias = 7) {
  return useQuery({
    queryKey: [...despesasKey, 'recorrentes-proximas', dias],
    queryFn: () => despesaService.recorrentesProximas(dias),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCriarDespesa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: DespesaRequest) => despesaService.criar(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: despesasKey })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
  })
}

export function useAtualizarDespesa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: DespesaRequest }) =>
      despesaService.atualizar(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: despesasKey })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
  })
}

export function useRemoverDespesa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => despesaService.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: despesasKey })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
  })
}

export function usePagarDespesa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => despesaService.pagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: despesasKey })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
  })
}

export function useUploadComprovanteDespesa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, arquivo }: { id: string; arquivo: File }) =>
      despesaService.uploadComprovante(id, arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: despesasKey })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
    },
  })
}

export function useCriarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: DespesaCategoriaRequest) => despesaService.criarCategoria(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...despesasKey, 'categorias'] })
    },
  })
}

export function useAtualizarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: DespesaCategoriaRequest }) =>
      despesaService.atualizarCategoria(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...despesasKey, 'categorias'] })
      queryClient.invalidateQueries({ queryKey: despesasKey })
    },
  })
}

export function useRemoverCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => despesaService.removerCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...despesasKey, 'categorias'] })
      queryClient.invalidateQueries({ queryKey: despesasKey })
    },
  })
}
