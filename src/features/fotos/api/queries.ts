import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fotoService } from '../services/foto.service'

export function useAgendamento(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: ['agendamento', agendamentoId],
    queryFn: () => fotoService.getAgendamento(agendamentoId!),
    enabled: !!agendamentoId,
  })
}

export function useFotosList(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: ['fotos', agendamentoId],
    queryFn: () => fotoService.listar(agendamentoId!),
    enabled: !!agendamentoId,
  })
}

export function useUploadFotos(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (arquivos: File[]) => fotoService.upload(agendamentoId, arquivos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Fotos enviadas com sucesso')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao enviar fotos'),
  })
}

export function usePublicarFotos(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fotoService.publicar(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Galeria publicada com sucesso')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao publicar galeria'),
  })
}

export function useUpdateFotoMetadata(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, metadata }: { fotoId: string; metadata: { titulo?: string; tags?: string[]; categoria?: string; destaque?: boolean } }) =>
      fotoService.atualizarMetadata(agendamentoId, fotoId, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Metadados atualizados')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao atualizar metadados'),
  })
}

export function useDeletarFoto(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fotoId: string) => fotoService.deletar(agendamentoId, fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Foto removida')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao remover foto'),
  })
}

export function useAlterarVisibilidade(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, visivel }: { fotoId: string; visivel: boolean }) =>
      fotoService.alterarVisibilidade(agendamentoId, fotoId, visivel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Visibilidade da foto atualizada')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao alterar visibilidade'),
  })
}

export function useAlterarStatus(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, status }: { fotoId: string; status: string }) =>
      fotoService.alterarStatus(agendamentoId, fotoId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      const label = variables.status === 'PUBLICADA' ? 'publicada' : 'despublicada'
      toast.success(`Foto ${label} com sucesso`)
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao alterar status da foto'),
  })
}

export function useSubstituirImagem(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, arquivo }: { fotoId: string; arquivo: File }) =>
      fotoService.substituirImagem(agendamentoId, fotoId, arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Imagem substituída com sucesso')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao substituir imagem'),
  })
}
