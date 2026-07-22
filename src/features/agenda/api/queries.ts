import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { agendamentoService } from '../services/agendamento.service'
import type { WizardFormValues, EditarAgendamentoFormData } from '../schemas/agendamento.schema'
import { QUERY_KEYS } from '@/shared/constants'
import type { AgendamentoStatus, TarefaStatus, TarefaTipo } from '@/shared/constants'

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

export function useBuscarClientePorTelefone(telefone: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CLIENTES, 'search', telefone],
    queryFn: () => agendamentoService.buscarClientePorTelefone(telefone),
    enabled: telefone.length >= 14,
    staleTime: 1000 * 60,
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
      toast.success('Agendamento atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar agendamento')
    },
  })
}

export function usePagamentosList(agendamentoId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCEIRO, 'pagamentos', agendamentoId],
    queryFn: () => agendamentoService.listarPagamentos(agendamentoId),
    enabled: !!agendamentoId,
  })
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, comprovante }: { data: WizardFormValues; comprovante?: File }) =>
      agendamentoService.createFromWizard(data, comprovante),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES })
      toast.success('Agendamento criado com sucesso')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Erro ao criar agendamento'
      toast.error(msg)
    },
  })
}

export function useUpdateAgendamentoStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgendamentoStatus }) =>
      agendamentoService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Status atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status')
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
      toast.success('Ensaio reagendado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reagendar ensaio')
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
      toast.error(error.message || 'Erro ao alternar destaque')
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
      toast.success('Fotos extras adicionadas')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar fotos extras')
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
      toast.success('Vídeos extras adicionados')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar vídeos extras')
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
      toast.success('Pagamento final registrado')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar pagamento final')
    },
  })
}

export function useTarefasList(agendamentoId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TAREFAS, agendamentoId ?? 'all'],
    queryFn: () => agendamentoService.listTarefas(agendamentoId),
  })
}

export function useCreateTarefa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      agendamentoId: string
      tipo: TarefaTipo
      responsavelId?: string | null
      dataLimite: string
    }) => agendamentoService.createTarefa(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAREFAS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      toast.success('Tarefa criada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar tarefa')
    },
  })
}

export function useUpdateTarefaStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TarefaStatus }) =>
      agendamentoService.updateTarefaStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAREFAS })
      toast.success('Tarefa atualizada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar tarefa')
    },
  })
}
