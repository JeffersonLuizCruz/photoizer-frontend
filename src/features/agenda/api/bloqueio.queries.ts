import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'
import { bloqueioService } from '../services/bloqueio.service'
import type { BloqueioAgendaPayload } from '../types'

export function useBloqueios(inicio?: string, fim?: string, profissionalId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BLOQUEIOS, inicio, fim, profissionalId],
    queryFn: () => bloqueioService.list(inicio!, fim!, profissionalId),
    enabled: !!inicio && !!fim,
    staleTime: 1000 * 30,
  })
}

export function useCriarBloqueio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BloqueioAgendaPayload) => bloqueioService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOQUEIOS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Compromisso criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao criar compromisso'))
    },
  })
}

export function useAtualizarBloqueio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BloqueioAgendaPayload }) =>
      bloqueioService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOQUEIOS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Compromisso atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao atualizar compromisso'))
    },
  })
}

export function useCancelarBloqueio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bloqueioService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOQUEIOS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Compromisso cancelado')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao cancelar compromisso'))
    },
  })
}
