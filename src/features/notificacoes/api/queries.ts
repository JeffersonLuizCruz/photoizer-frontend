import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificacaoService } from '../services/notificacao.service'

export function useNotificacoes(userId: string | undefined) {
  return useQuery({
    queryKey: ['notificacoes', userId],
    queryFn: () => notificacaoService.listar(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  })
}

export function useNotificacoesNaoLidas(userId: string | undefined) {
  return useQuery({
    queryKey: ['notificacoes', userId, 'nao-lidas'],
    queryFn: () => notificacaoService.contarNaoLidas(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  })
}

export function useMarcarComoLida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificacaoService.marcarComoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}

export function useMarcarTodasComoLidas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => notificacaoService.marcarTodasComoLidas(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}