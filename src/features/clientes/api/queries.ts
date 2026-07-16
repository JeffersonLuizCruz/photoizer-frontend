import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteService } from '../services/cliente.service'
import type { ClienteListParams } from '../types'
import type { ClienteFormData } from '../schemas/cliente.schema'
import { QUERY_KEYS } from '@/shared/constants'

export function useClientesList(params?: ClienteListParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CLIENTES, params],
    queryFn: () => clienteService.list(params),
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CLIENTES, id],
    queryFn: () => clienteService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ClienteFormData) => clienteService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES })
      toast.success('Cliente cadastrado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cadastrar cliente')
    },
  })
}

export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ClienteFormData) => clienteService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES })
      toast.success('Cliente atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar cliente')
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES })
      toast.success('Cliente excluído com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir cliente')
    },
  })
}
