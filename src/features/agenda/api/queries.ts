import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { agendamentoService } from '../services/agendamento.service'
import type { EditarAgendamentoFormData } from '../schemas/agendamento.schema'
import { QUERY_KEYS } from '@/shared/constants'
import type { AgendamentoStatus } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'

export function useConfig() {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'config'],
    queryFn: () => agendamentoService.getConfig(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFinanceiroPreview(pacoteId: string | undefined, taxaDeslocamento: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'preview', pacoteId, taxaDeslocamento],
    queryFn: () => agendamentoService.previewFinanceiro(pacoteId!, taxaDeslocamento),
    enabled: !!pacoteId,
    staleTime: Infinity,
  })
}

export function usePacotesList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.PACOTES],
    queryFn: () => agendamentoService.listPacotes(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUsuariosList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'usuarios'],
    queryFn: () => agendamentoService.listUsuarios(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useDisponibilidade(data: Date | undefined, hora: string | undefined, duracao: number, bloqueiaDiaInteiro: boolean, fotografoId?: string, excluirAgendamentoId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'disponibilidade', data?.toISOString(), hora, duracao, bloqueiaDiaInteiro, fotografoId, excluirAgendamentoId],
    queryFn: () => agendamentoService.verificarDisponibilidade(
      data ? format(data, 'yyyy-MM-dd') : '',
      hora!,
      duracao,
      bloqueiaDiaInteiro,
      fotografoId,
      excluirAgendamentoId,
    ),
    enabled: !!data && !!hora,
    retry: false,
    staleTime: 1000 * 30,
  })
}

export function useAgendamentosList(params?: {
  status?: AgendamentoStatus
  editorId?: string
  dataInicio?: string
  dataFim?: string
  search?: string
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'list', params],
    queryFn: () => agendamentoService.list(params),
  })
}

export function useAgendamento(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, id],
    queryFn: () => agendamentoService.getById(id),
    enabled: !!id,
  })
}

export function useUpdateAgendamento(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: EditarAgendamentoFormData) =>
      agendamentoService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Agendamento atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao atualizar agendamento'))
    },
  })
}

export function useReatribuirFotografo(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { fotografoId: string; motivo?: string }) =>
      agendamentoService.reatribuirFotografo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Ensaio transferido com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao transferir ensaio'))
    },
  })
}

export function useReatribuicoes(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, id, 'reatribuicoes'],
    queryFn: () => agendamentoService.listarReatribuicoes(id),
    enabled: !!id,
  })
}

export function usePagamentosList(agendamentoId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'pagamentos', agendamentoId],
    queryFn: () => agendamentoService.listarPagamentos(agendamentoId),
    enabled: !!agendamentoId,
  })
}

export function useResumoFinanceiroTrabalho(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'trabalho', agendamentoId],
    queryFn: () => agendamentoService.resumoFinanceiro(agendamentoId!),
    enabled: !!agendamentoId,
  })
}

export function useVincularDespesaTrabalho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ despesaId, agendamentoId }: { despesaId: string; agendamentoId: string | null }) =>
      agendamentoService.vincularDespesa(despesaId, agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
  })
}

export function useConfirmarPagamentoAgendamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => agendamentoService.confirmarPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROPOSTAS })
      toast.success('Pagamento da reserva confirmado')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao confirmar pagamento')),
  })
}

export function useAprovarAgendamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => agendamentoService.aprovar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROPOSTAS })
      toast.success('Proposta aprovada. O agendamento foi confirmado.')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao aprovar proposta')),
  })
}

export function useUpdateAgendamentoStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgendamentoStatus }) =>
      agendamentoService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Status atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao atualizar status'))
    },
  })
}

export function useReagendarAgendamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data, hora }: { id: string; data: string; hora: string }) =>
      agendamentoService.reagendar(id, data, hora),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Ensaio reagendado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao reagendar ensaio'))
    },
  })
}

export function useToggleDestaque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => agendamentoService.toggleDestaque(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao alternar destaque'))
    },
  })
}

export function useAddFotoExtra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      agendamentoId: string
      quantidade: number
      valorUnitario: number
      indicadorId?: string
      indicadorNome?: string
      indicadorTelefone?: string
    }) => agendamentoService.addFotoExtra(payload.agendamentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Fotos extras adicionadas')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao adicionar fotos extras'))
    },
  })
}

export function useAddVideoExtra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      agendamentoId: string
      quantidade: number
      valorUnitario: number
      indicadorId?: string
      indicadorNome?: string
      indicadorTelefone?: string
    }) => agendamentoService.addVideoExtra(payload.agendamentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Vídeos extras adicionados')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao adicionar vídeos extras'))
    },
  })
}

export function useRegistrarPagamentoFinal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comprovante }: { id: string; comprovante?: File }) =>
      agendamentoService.registrarPagamentoFinal(id, comprovante),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Pagamento final registrado')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao registrar pagamento final'))
    },
  })
}


