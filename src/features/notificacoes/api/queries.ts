import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificacaoService } from '../services/notificacao.service'

export function useNotificacoes() {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => notificacaoService.listar(),
    refetchInterval: 30_000,
  })
}

export function useNotificacoesNaoLidas() {
  return useQuery({
    queryKey: ['notificacoes', 'nao-lidas'],
    queryFn: () => notificacaoService.contarNaoLidas(),
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
    mutationFn: () => notificacaoService.marcarTodasComoLidas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}
