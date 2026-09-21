import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pacoteService } from '../services/pacote.service'
import type { PacoteFormData } from '../schemas/pacote.schema'
import { QUERY_KEYS } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'

export function usePacotesList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.PACOTES],
    queryFn: () => pacoteService.list(),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePacote(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PACOTES, id],
    queryFn: () => pacoteService.getById(id!),
    enabled: !!id,
  })
}

export function useCreatePacote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PacoteFormData) => pacoteService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PACOTES })
      toast.success('Pacote criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao criar pacote'))
    },
  })
}

export function useUpdatePacote(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PacoteFormData) => pacoteService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PACOTES })
      toast.success('Pacote atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao atualizar pacote'))
    },
  })
}

export function useInativarPacote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => pacoteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PACOTES })
      toast.success('Pacote inativado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao inativar pacote'))
    },
  })
}

export function useAtivarPacote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PacoteFormData }) =>
      pacoteService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PACOTES })
      toast.success('Pacote ativado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao ativar pacote'))
    },
  })
}
