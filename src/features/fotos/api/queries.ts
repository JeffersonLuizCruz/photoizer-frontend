import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fotoService, UploadLoteError, type UploadProgress } from '../services/foto.service'
import { extractErrorMessage } from '@/shared/api'

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

export interface UploadFotosVariables {
  arquivos: File[]
  onProgress?: (progress: UploadProgress) => void
}

export function useUploadFotos(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ arquivos, onProgress }: UploadFotosVariables) =>
      fotoService.upload(agendamentoId, arquivos, onProgress),
    onSuccess: (fotos) => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success(`${fotos.length} foto(s) enviada(s) com sucesso`)
    },
    onError: (error: Error) => {
      if (error instanceof UploadLoteError) {
        // Lotes anteriores já foram persistidos: atualiza a grade e avisa
        // quantas fotos entraram antes da falha.
        queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
        const detalhe = extractErrorMessage(error.causa, '')
        const parcial = error.enviadas.length > 0
          ? `${error.enviadas.length} foto(s) enviada(s); falhou no lote ${error.lote}/${error.totalLotes}. `
          : ''
        toast.error(`${parcial}${detalhe || 'Erro ao enviar fotos'}`)
        return
      }
      toast.error(extractErrorMessage(error, 'Erro ao enviar fotos'))
    },
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
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao publicar galeria')),
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
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao atualizar metadados')),
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
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao remover foto')),
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
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao alterar visibilidade')),
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
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao alterar status da foto')),
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
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao substituir imagem')),
  })
}

export function useComentariosAdmin(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: ['comentarios-fotos', agendamentoId],
    queryFn: () => fotoService.listarComentarios(agendamentoId!),
    enabled: !!agendamentoId,
  })
}

export function useResponderComentario(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, mensagem }: { fotoId: string; mensagem: string }) =>
      fotoService.responderComentario(agendamentoId, fotoId, mensagem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-fotos', agendamentoId] })
      toast.success('Resposta enviada!')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao responder comentário')),
  })
}

export function useMarcarComentariosLidos(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fotoId: string) => fotoService.marcarComentariosLidos(agendamentoId, fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-fotos', agendamentoId] })
    },
  })
}
