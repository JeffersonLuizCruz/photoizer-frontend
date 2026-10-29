import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fotoService, UploadLoteError, type UploadProgress } from '../services/foto.service'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type {
  AdminEcommerceResumoResponse,
  FotoEnsaio,
  GaleriaEnsaioResponse,
  QualidadePreview,
  SelecaoEnsaioResponse,
} from '@/features/ecommerce/types/ecommerce.types'
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
    // O cliente pode enviar a seleção/comprar enquanto o staff está no
    // workspace; um polling curto evita dados defasados sem WebSocket.
    refetchInterval: 60_000,
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

export interface ReeditarFotoVariables {
  fotoId: string
  arquivo: File
}

export function useReeditarFoto(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, arquivo }: ReeditarFotoVariables) =>
      fotoService.uploadReedicao(agendamentoId, fotoId, arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['selecoes-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      toast.success('Reedição enviada. O cliente já pode baixar a nova versão.')
    },
    onError: (error: Error) =>
      toast.error(extractErrorMessage(error, 'Erro ao enviar a reedição')),
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

export function useAplicarQualidadeGaleria(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (qualidade: QualidadePreview) =>
      ecommerceService.adminAlterarQualidadeGaleria(agendamentoId, qualidade),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      const partes = [`${resultado.geradas} gerada(s)`, `${resultado.reaproveitadas} reaproveitada(s)`]
      if (resultado.falhas > 0) partes.push(`${resultado.falhas} falha(s)`)
      if (resultado.ignoradas > 0) partes.push(`${resultado.ignoradas} ignorada(s)`)
      const mensagem = `Qualidade da prévia aplicada: ${partes.join(', ')}`
      if (resultado.falhas > 0) toast.warning(mensagem)
      else toast.success(mensagem)
    },
    onError: (error: Error) =>
      toast.error(extractErrorMessage(error, 'Erro ao aplicar a qualidade da prévia')),
  })
}

export function useGaleriaEnsaio(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: ['galeria-ensaio', agendamentoId],
    queryFn: () => ecommerceService.adminGaleria(agendamentoId!),
    enabled: !!agendamentoId,
    refetchInterval: 60_000,
  })
}

export function useAlterarModoGaleria(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (modo: GaleriaEnsaioResponse['modo']) =>
      ecommerceService.adminAlterarModoGaleria(agendamentoId, modo),
    onSuccess: (data) => {
      queryClient.setQueryData(['galeria-ensaio', agendamentoId], data)
      queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['selecoes-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      toast.success('Modo da galeria atualizado')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao alterar o modo da galeria')),
  })
}

export function useDefinirCapaGaleria(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fotoId: string | null) =>
      ecommerceService.adminDefinirCapaGaleria(agendamentoId, fotoId),
    onSuccess: (data) => {
      queryClient.setQueryData(['galeria-ensaio', agendamentoId], data)
      queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Capa da galeria atualizada')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao atualizar a capa')),
  })
}

export function useAtualizarTituloGaleria(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tituloHero: string | null) =>
      ecommerceService.adminAtualizarTituloGaleria(agendamentoId, tituloHero),
    onSuccess: (data) => {
      queryClient.setQueryData(['galeria-ensaio', agendamentoId], data)
      queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', agendamentoId] })
      toast.success('Texto do hero atualizado')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao atualizar o texto do hero')),
  })
}

export function useRenumerarGaleria(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fotoService.renumerar(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      toast.success('Galeria renumerada sequencialmente')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao renumerar galeria')),
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
      queryClient.invalidateQueries({ queryKey: ['comentarios-fotos', agendamentoId] })
      toast.success('Foto removida')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao remover foto')),
  })
}

export function useDeletarFotosEmLote(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fotoIds: string[]) => fotoService.removerEmLote(agendamentoId, fotoIds),
    onSuccess: ({ removidas }) => {
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['comentarios-fotos', agendamentoId] })
      toast.success(`${removidas} foto(s) removida(s)`)
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao remover fotos')),
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

export function useSelecoesDoAgendamento(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: ['selecoes-ensaio', agendamentoId],
    queryFn: () => ecommerceService.adminSelecoesDoAgendamento(agendamentoId!),
    enabled: !!agendamentoId,
    refetchInterval: 60_000,
  })
}

export function useAdminResumo(agendamentoId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['admin-ecommerce', agendamentoId],
    queryFn: () => ecommerceService.adminResumo(agendamentoId!),
    enabled: enabled && !!agendamentoId,
    refetchInterval: enabled ? 60_000 : false,
  })
}

export function useOverrideSelecao(agendamentoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, selecionada }: { fotoId: string; selecionada: boolean }) =>
      ecommerceService.adminOverrideSelecao(agendamentoId, fotoId, selecionada),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['selecoes-ensaio', agendamentoId] })
      toast.success('Seleção atualizada')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao atualizar seleção')),
  })
}

export interface GaleriaWorkspaceCounts {
  total: number
  publicadas: number
  pendentesPublicacao: number
  pacote: number
  extras: number
  aguardandoEdicao: number
  comprasPendentes: number
  selecoesPendentes: number
  valorExtras: number
}

export interface GaleriaWorkspace {
  fotos: FotoEnsaio[]
  galeria: GaleriaEnsaioResponse | undefined
  selecoes: SelecaoEnsaioResponse[]
  selecaoAtiva: SelecaoEnsaioResponse | null
  selecaoPublicada: SelecaoEnsaioResponse | null
  selecaoAtual: SelecaoEnsaioResponse | null
  resumo: AdminEcommerceResumoResponse | undefined
  tipoPorFoto: Map<string, 'PACOTE' | 'EXTRA'>
  counts: GaleriaWorkspaceCounts
  isLoading: boolean
  error: unknown
  refetch: () => Promise<void>
}

/**
 * Agrega os dados do workspace administrativo da galeria.
 *
 * Reaproveita as queries já existentes (fotos, configuração, seleções e
 * resumo do e-commerce) para que as abas não disparem chamadas duplicadas.
 */
export function useGaleriaWorkspace(
  agendamentoId: string | undefined,
  options: { incluirResumo?: boolean } = {},
): GaleriaWorkspace {
  const fotosQuery = useFotosList(agendamentoId)
  const galeriaQuery = useGaleriaEnsaio(agendamentoId)
  const selecoesQuery = useSelecoesDoAgendamento(agendamentoId)
  const resumoQuery = useAdminResumo(agendamentoId, options.incluirResumo ?? false)

  const fotos = fotosQuery.data ?? []
  const selecoes = selecoesQuery.data ?? []
  const selecaoAtiva = selecoes.find(
    (selecao) => selecao.status === 'ENVIADA' || selecao.status === 'EM_EDICAO' || selecao.status === 'CONCLUIDA',
  ) ?? null
  const selecaoPublicada = selecoes.find((selecao) => selecao.status === 'PUBLICADA') ?? null
  const selecaoAtual = selecaoAtiva ?? selecaoPublicada
  const itens = selecaoAtual?.itens ?? []
  const resumo = resumoQuery.data
  const compras = resumo?.comprasExtras ?? []
  const tipoPorFoto = new Map<string, 'PACOTE' | 'EXTRA'>(
    itens.map((item) => [item.fotoId, item.tipo]),
  )
  const extrasItens = itens.filter((item) => item.tipo === 'EXTRA')

  const counts: GaleriaWorkspaceCounts = {
    total: fotos.length,
    publicadas: fotos.filter((foto) => foto.status === 'PUBLICADA').length,
    // Fotos PAGA/AGUARDANDO já saíram de INEDITA e não precisam de nova
    // publicação; só as inéditas ficam pendentes.
    pendentesPublicacao: fotos.filter((foto) => foto.status === 'INEDITA').length,
    pacote: selecaoAtual?.quantidadePacote ?? fotos.filter((foto) => foto.selecionadaPacote).length,
    extras: selecaoAtual?.quantidadeExtras ?? extrasItens.length,
    aguardandoEdicao: galeriaQuery.data?.requerEdicao
      ? itens.filter((item) => !item.editada).length
      : 0,
    comprasPendentes: compras.filter(
      (compra) => compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO',
    ).length,
    // Seleção ativa = o estúdio ainda precisa agir (iniciar/concluir a edição
    // ou aprovar a seleção no modo SEM_EDICAO). Não depende da quantidade de
    // extras, então também aparece quando o cliente escolhe só fotos do pacote.
    selecoesPendentes: selecoes.filter(
      (selecao) => selecao.status === 'ENVIADA' || selecao.status === 'EM_EDICAO' || selecao.status === 'CONCLUIDA',
    ).length,
    valorExtras: extrasItens.reduce((total, item) => total + (item.valorUnitario ?? 0), 0),
  }

  const refetch = async () => {
    const tarefas: Promise<unknown>[] = [
      fotosQuery.refetch(),
      galeriaQuery.refetch(),
      selecoesQuery.refetch(),
    ]
    if (options.incluirResumo) {
      tarefas.push(resumoQuery.refetch())
    }
    await Promise.all(tarefas)
  }

  return {
    fotos,
    galeria: galeriaQuery.data,
    selecoes,
    selecaoAtiva,
    selecaoPublicada,
    selecaoAtual,
    resumo,
    tipoPorFoto,
    counts,
    isLoading: fotosQuery.isLoading || galeriaQuery.isLoading || selecoesQuery.isLoading,
    error: fotosQuery.error ?? galeriaQuery.error ?? selecoesQuery.error,
    refetch,
  }
}
