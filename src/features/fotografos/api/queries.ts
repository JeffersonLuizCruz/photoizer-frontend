import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fotografoService } from '../services/fotografo.service'
import { QUERY_KEYS } from '@/shared/constants'
import type { CriarFotografoData, AtualizarFotografoData, FotografoRepasseInput } from '../services/fotografo.service'

export function useFotografosList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografos'],
    queryFn: () => fotografoService.listar(),
  })
}

export { useParceirosList } from '@/shared/api/parceiros'

export function useFotografo(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografo', id],
    queryFn: () => fotografoService.getById(id!),
    enabled: !!id,
  })
}

export function useFotografoDashboard(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografo', id, 'dashboard'],
    queryFn: () => fotografoService.dashboard(id!),
    enabled: !!id,
  })
}

export function useFotografoEnsaios(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografo', id, 'ensaios'],
    queryFn: () => fotografoService.listarEnsaios(id!),
    enabled: !!id,
  })
}

export function useExportarCsvFotografo() {
  return useMutation({
    mutationFn: (id: string) => fotografoService.exportarCsv(id),
  })
}

export function useCriarFotografo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarFotografoData) => fotografoService.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.AGENDA, 'fotografos'] })
      toast.success('Fotógrafo criado com sucesso')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao criar fotógrafo')
    },
  })
}

export function useAtualizarFotografo(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AtualizarFotografoData) => fotografoService.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.AGENDA, 'fotografos'] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.AGENDA, 'fotografo', id] })
      toast.success('Fotógrafo atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao atualizar fotógrafo')
    },
  })
}

export function useToggleStatusFotografo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fotografoService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.AGENDA, 'fotografos'] })
      toast.success('Status do fotógrafo alterado')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao alterar status')
    },
  })
}

export function useResumoFinanceiroFotografo(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografo', id, 'resumo-financeiro'],
    queryFn: () => fotografoService.resumoFinanceiro(id!),
    enabled: !!id,
  })
}

export function useCustosFotografo(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografo', id, 'custos'],
    queryFn: () => fotografoService.listarCustos(id!),
    enabled: !!id,
  })
}

export function useRelatorioGlobalFotografos() {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'fotografos', 'relatorio-global'],
    queryFn: () => fotografoService.relatorioGlobal(),
  })
}

export function useRemoverFotografo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fotografoService.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.AGENDA, 'fotografos'] })
      toast.success('Fotógrafo removido')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao remover fotógrafo')
    },
  })
}

export function useAtualizarRepasse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agendamentoId,
      fotografoId,
      payload,
    }: {
      agendamentoId: string
      fotografoId: string
      payload: FotografoRepasseInput
    }) => fotografoService.atualizarRepasse(agendamentoId, fotografoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.FINANCEIRO, 'repasses-pendentes'] })
      toast.success('Repasse atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao atualizar repasse')
    },
  })
}

export function usePagarRepasse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ agendamentoId, fotografoId }: { agendamentoId: string; fotografoId: string }) =>
      fotografoService.pagarRepasse(agendamentoId, fotografoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      toast.success('Repasse marcado como pago')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao pagar repasse')
    },
  })
}

export function useRepassesPendentes(fotografoId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'repasses-pendentes', fotografoId],
    queryFn: () => fotografoService.listarRepassesPendentes(fotografoId),
  })
}

export function usePagarRepasseLote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => fotografoService.pagarRepasseLote(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.FINANCEIRO, 'repasses-pendentes'] })
      toast.success('Repasses pagos com sucesso')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao pagar repasses')
    },
  })
}