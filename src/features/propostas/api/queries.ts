import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/shared/constants'
import { parseDuracao } from '@/shared/lib/duracao'
import { extractErrorMessage } from '@/shared/api'
import { propostaService } from '../services/proposta.service'
import type { NovaPropostaFormValues, AssinarPropostaFormValues } from '../schemas/proposta.schema'

export function usePacotesOptions() {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROPOSTAS, 'pacotes'],
    queryFn: () => propostaService.listPacotes(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUsuariosOptions() {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROPOSTAS, 'usuarios'],
    queryFn: () => propostaService.listUsuarios(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useIndicadoresSearch(search: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROPOSTAS, 'indicadores', search],
    queryFn: () => propostaService.listIndicadores(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 30,
  })
}

export function useDisponibilidadeProposta(
  data: Date | undefined,
  hora: string | undefined,
  pacote?: { duracaoEstimada?: string; bloqueiaDiaInteiro?: boolean },
  fotografoId?: string,
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROPOSTAS, 'disponibilidade', data?.toISOString(), hora, pacote?.duracaoEstimada, pacote?.bloqueiaDiaInteiro, fotografoId],
    queryFn: () =>
      propostaService.verificarDisponibilidade(
        data ? format(data, 'yyyy-MM-dd') : '',
        hora!,
        parseDuracao(pacote?.duracaoEstimada),
        pacote?.bloqueiaDiaInteiro ?? false,
        fotografoId,
      ),
    enabled: !!data && !!hora,
    retry: false,
    staleTime: 1000 * 30,
  })
}

export function usePropostasList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROPOSTAS, 'list'],
    queryFn: () => propostaService.listarPropostas(),
  })
}

export function useCriarProposta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NovaPropostaFormValues) => {
      const [h, m] = payload.hora.split(':').map(Number)
      const base = payload.data instanceof Date ? payload.data : new Date(payload.data)
      const dataHoraEnsaio = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0)
      const fotografos = (payload.fotografos ?? [])
        .filter((f) => f?.fotografoId)
        .map((f) => ({
          fotografoId: f.fotografoId,
          tipoValor: (f.tipoValor ?? 'FIXO') as 'FIXO' | 'PERCENTUAL',
          valorRepassar: (f.tipoValor ?? 'FIXO') === 'FIXO' ? f.valorRepassar : undefined,
          percentual: (f.tipoValor ?? 'FIXO') === 'PERCENTUAL' ? f.percentual : undefined,
        }))
      return propostaService.criarProposta({
        pacoteId: payload.pacoteId,
        editorId: payload.editorId || undefined,
        fotografoId: payload.fotografoId || undefined,
        dataHoraEnsaio: dataHoraEnsaio.toISOString(),
        localEnsaio: payload.localEnsaio,
        custoDeslocamento: payload.custoDeslocamento,
        repassarDeslocamento: payload.repassarDeslocamento,
        observacoes: payload.observacoes || undefined,
        indicadorId: payload.indicadorId || undefined,
        indicadorNome: payload.indicadorNome || undefined,
        indicadorTelefone: payload.indicadorTelefone || undefined,
        fotografos: fotografos.length > 0 ? fotografos : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROPOSTAS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Proposta criada. Copie o link e envie ao cliente.')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao criar proposta'))
    },
  })
}

export function useConfirmarPagamentoProposta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propostaService.confirmarPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROPOSTAS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Pagamento da reserva confirmado')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao confirmar pagamento'))
    },
  })
}

export function useAprovarProposta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propostaService.aprovar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROPOSTAS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Proposta aprovada. O agendamento foi confirmado.')
    },
    onError: (error: Error) => {
      if (isAxiosError(error) && error.response?.status === 409) return
      toast.error(extractErrorMessage(error, 'Erro ao aprovar proposta'))
    },
  })
}

export function usePropostaPublica(token: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROPOSTAS, 'publico', token],
    queryFn: () => propostaService.carregarPublico(token),
    enabled: !!token,
    retry: false,
  })
}

export function useAssinarProposta(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      valores,
      comprovante,
      assinaturaImagem,
    }: {
      valores: AssinarPropostaFormValues
      comprovante?: File
      assinaturaImagem: Blob | null
    }) => propostaService.assinar(token, valores, comprovante, assinaturaImagem),
    onSuccess: (resultado) => {
      queryClient.setQueryData([...QUERY_KEYS.PROPOSTAS, 'publico', token], (atual: unknown) =>
        atual ? { ...(atual as object), status: resultado.status } : atual,
      )
      toast.success('Proposta assinada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao assinar proposta'))
    },
  })
}
