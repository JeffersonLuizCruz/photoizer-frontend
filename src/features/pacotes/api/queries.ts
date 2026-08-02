import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pacoteService } from '../services/pacote.service'
import type { PacoteFormData } from '../schemas/pacote.schema'
import { QUERY_KEYS } from '@/shared/constants'

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
      toast.error(error.message || 'Erro ao criar pacote')
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
      toast.error(error.message || 'Erro ao atualizar pacote')
    },
  })
}

export function useDeletePacote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => pacoteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PACOTES })
      toast.success('Pacote excluído com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir pacote')
    },
  })
}
