import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/shared/constants'
import { parseDuracao } from '@/shared/lib/duracao'
import type { ContratoStatus } from '@/shared/constants'
import { contratoService } from '../services/contrato.service'
import { contratoPublicoService } from '../services/contratoPublico.service'
import type { CriarContratoFormValues, AssinarContratoFormValues } from '../schemas/contrato.schema'

export function useContratosList(params?: { status?: ContratoStatus; search?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRATOS, 'list', params],
    queryFn: () => contratoService.listar(params),
  })
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRATOS, id],
    queryFn: () => contratoService.buscar(id),
    enabled: !!id,
  })
}

export function usePacotesOptions() {
  return useQuery({
    queryKey: [...QUERY_KEYS.PACOTES, 'options'],
    queryFn: () => contratoService.listPacotes(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUsuariosOptions() {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRATOS, 'usuarios'],
    queryFn: () => contratoService.listUsuarios(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useIndicadoresSearch(search: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRATOS, 'indicadores', search],
    queryFn: () => contratoService.listIndicadores(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 30,
  })
}

export function useDisponibilidadeContrato(
  data: Date | undefined,
  hora: string | undefined,
  pacote?: { duracaoEstimada?: string; bloqueiaDiaInteiro?: boolean },
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRATOS, 'disponibilidade', data?.toISOString(), hora, pacote?.duracaoEstimada, pacote?.bloqueiaDiaInteiro],
    queryFn: () =>
      contratoService.verificarDisponibilidade(
        data ? format(data, 'yyyy-MM-dd') : '',
        hora!,
        parseDuracao(pacote?.duracaoEstimada),
        pacote?.bloqueiaDiaInteiro ?? false,
      ),
    enabled: !!data && !!hora,
    retry: false,
    staleTime: 1000 * 30,
  })
}

export function useCriarContrato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CriarContratoFormValues) => {
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
      return contratoService.criar({
        clienteId: payload.clienteId || undefined,
        pacoteId: payload.pacoteId,
        dataHoraEnsaio: dataHoraEnsaio.toISOString(),
        localEnsaio: payload.localEnsaio,
        enderecoCompleto: payload.enderecoCompleto || undefined,
        editorId: payload.editorId || undefined,
        custoDeslocamento: payload.custoDeslocamento,
        repassarDeslocamento: payload.repassarDeslocamento,
        fotografos: fotografos.length > 0 ? fotografos : undefined,
        observacoes: payload.observacoes || undefined,
        indicadorId: payload.indicadorId || undefined,
        indicadorNome: payload.indicadorNome || undefined,
        indicadorTelefone: payload.indicadorTelefone || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRATOS })
      toast.success('Contrato criado em rascunho')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao criar contrato')
    },
  })
}

export function usePublicarContrato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contratoService.publicar(id),
    onSuccess: (resposta) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRATOS })
      toast.success('Contrato publicado. Copie o link e envie ao cliente.')
      return resposta
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao publicar contrato')
    },
  })
}

export function useConfirmarPagamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contratoService.confirmarPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRATOS })
      toast.success('Pagamento da reserva confirmado')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao confirmar pagamento')
    },
  })
}

export function useAprovarContrato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contratoService.aprovar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRATOS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Contrato aprovado. Agendamento criado na agenda.')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao aprovar contrato')
    },
  })
}

export function useDevolverContrato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { tipoMotivo?: string; motivo: string } }) =>
      contratoService.devolver(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRATOS })
      toast.success('Contrato devolvido ao cliente')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao devolver contrato')
    },
  })
}

export function useCancelarContrato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contratoService.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRATOS })
      toast.success('Contrato cancelado')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao cancelar contrato')
    },
  })
}

export function useContratoPublico(token: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRATOS, 'publico', token],
    queryFn: () => contratoPublicoService.carregar(token),
    enabled: !!token,
    retry: false,
  })
}

export function useAssinarContrato(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ valores, comprovante }: { valores: AssinarContratoFormValues; comprovante?: File }) =>
      contratoPublicoService.assinar(token, valores, comprovante),
    onSuccess: (resultado) => {
      queryClient.setQueryData([...QUERY_KEYS.CONTRATOS, 'publico', token], (atual: any) =>
        atual ? { ...atual, status: resultado.status } : atual,
      )
      toast.success('Contrato assinado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erro ao assinar contrato')
    },
  })
}