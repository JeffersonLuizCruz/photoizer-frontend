import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { edicaoService } from '../services/edicao.service'

const EDICAO_KEYS = {
  all: ['edicao'] as const,
  list: (status?: string) => ['edicao', 'list', status] as const,
  agendamento: (id: string) => ['edicao', id] as const,
  fotos: (id: string) => ['edicao', id, 'fotos'] as const,
}

export function useEdicaoList(status?: string) {
  return useQuery({
    queryKey: EDICAO_KEYS.list(status),
    queryFn: () => edicaoService.list(status),
  })
}

export function useEdicaoStatus(agendamentoId: string) {
  return useQuery({
    queryKey: EDICAO_KEYS.agendamento(agendamentoId),
    queryFn: () => edicaoService.obterStatus(agendamentoId),
    enabled: !!agendamentoId,
  })
}

export function useEdicaoFotos(agendamentoId: string) {
  return useQuery({
    queryKey: EDICAO_KEYS.fotos(agendamentoId),
    queryFn: () => edicaoService.listarFotos(agendamentoId),
    enabled: !!agendamentoId,
  })
}

export function useUploadRaw(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (arquivos: File[]) => edicaoService.uploadRaw(agendamentoId, arquivos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.all })
      toast.success('Fotos RAW enviadas com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar fotos RAW')
    },
  })
}

export function useUploadEditadas(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (arquivos: File[]) => edicaoService.uploadEditadas(agendamentoId, arquivos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.fotos(agendamentoId) })
      toast.success('Fotos editadas enviadas com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar fotos editadas')
    },
  })
}

export function useConcluirEdicao(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => edicaoService.concluirEdicao(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.agendamento(agendamentoId) })
      toast.success('Edição concluída com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao concluir edição')
    },
  })
}

export function useDeleteFoto(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fotoId: string) => edicaoService.deletarFoto(fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.fotos(agendamentoId) })
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.agendamento(agendamentoId) })
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.all })
      toast.success('Foto removida com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover foto')
    },
  })
}

export function useAtualizarObservacoes(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (observacoes: string) => edicaoService.atualizarObservacoes(agendamentoId, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.agendamento(agendamentoId) })
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.all })
      toast.success('Observações salvas')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar observações')
    },
  })
}

export function useReordenarFotos(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fotos: { id: string; ordem: number }[]) => edicaoService.reordenarFotos(fotos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.fotos(agendamentoId) })
      toast.success('Ordem atualizada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reordenar fotos')
    },
  })
}

export function usePublicarNoEcommerce(agendamentoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => edicaoService.publicarNoEcommerce(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EDICAO_KEYS.agendamento(agendamentoId) })
      toast.success('Fotos publicadas no ecommerce com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao publicar no ecommerce')
    },
  })
}
