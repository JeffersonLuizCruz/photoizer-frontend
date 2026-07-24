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
