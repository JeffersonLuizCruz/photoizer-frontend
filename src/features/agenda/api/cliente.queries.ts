import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteService } from '../services/cliente.service'
import type { ClienteFormData } from '../schemas/cliente.schema'
import { extractErrorMessage } from '@/shared/api'

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteService.getById(id!),
    enabled: !!id,
  })
}

export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ClienteFormData) => clienteService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao atualizar cliente'))
    },
  })
}
