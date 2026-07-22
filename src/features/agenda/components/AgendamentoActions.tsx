import { useState } from 'react'
import {
  Play,
  RotateCcw,
  XCircle,
  Ban,
  CreditCard,
  Send,
  CheckCheck,
  CheckCircle2,
  Star,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'
import { ReagendarDialog } from './ReagendarDialog'
import { useUpdateAgendamentoStatus, useCreateTarefa, useToggleDestaque } from '../api/queries'
import { AGENDAMENTO_STATUS, TAREFA_TIPO } from '@/shared/constants'
import type { Agendamento } from '../types'

interface AgendamentoActionsProps {
  agendamento: Agendamento
}

type ActionType = 'realizar' | 'reagendar' | 'cancelar' | 'noShow' | 'pagarFinal' | 'enviarSelecao' | 'confirmarEntrega' | 'finalizar'

const statusActions: Record<string, ActionType[]> = {
  [AGENDAMENTO_STATUS.CONFIRMADO]: ['realizar', 'reagendar', 'cancelar'],
  [AGENDAMENTO_STATUS.REALIZADO]: ['pagarFinal', 'cancelar'],
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: ['pagarFinal'],
  [AGENDAMENTO_STATUS.EM_EDICAO]: ['enviarSelecao'],
  [AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO]: ['confirmarEntrega'],
  [AGENDAMENTO_STATUS.FOTOS_ENTREGUES]: ['finalizar'],
}

const actionConfig: Record<ActionType, { label: string; icon: React.ComponentType<{ className?: string }>; variant: 'default' | 'destructive' | 'outline' | 'secondary'; confirmTitle?: string; confirmDescription?: string; status: string }> = {
  realizar: {
    label: 'Finalizar Ensaio',
    icon: Play,
    variant: 'default',
    confirmTitle: 'Finalizar Ensaio',
    confirmDescription: 'Confirmar que o ensaio foi realizado?',
    status: AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL,
  },
  reagendar: {
    label: 'Reagendar',
    icon: RotateCcw,
    variant: 'outline',
    status: AGENDAMENTO_STATUS.CONFIRMADO,
  },
  cancelar: {
    label: 'Cancelar',
    icon: XCircle,
    variant: 'outline',
    confirmTitle: 'Cancelar Agendamento',
    confirmDescription: 'Tem certeza que deseja cancelar este agendamento?',
    status: AGENDAMENTO_STATUS.CANCELADO,
  },
  noShow: {
    label: 'Não Compareceu',
    icon: Ban,
    variant: 'destructive',
    confirmTitle: 'Marcar como Não Compareceu',
    confirmDescription: 'Confirmar que o cliente não compareceu?',
    status: AGENDAMENTO_STATUS.NO_SHOW,
  },
  pagarFinal: {
    label: 'Registrar Pagamento Final',
    icon: CreditCard,
    variant: 'default',
    status: AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL,
  },
  enviarSelecao: {
    label: 'Enviar para Seleção',
    icon: Send,
    variant: 'default',
    confirmTitle: 'Enviar para Seleção',
    confirmDescription: 'Confirmar que as fotos foram enviadas para seleção?',
    status: AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO,
  },
  confirmarEntrega: {
    label: 'Confirmar Entrega',
    icon: CheckCheck,
    variant: 'default',
    confirmTitle: 'Confirmar Entrega',
    confirmDescription: 'Confirmar que as fotos foram entregues ao cliente?',
    status: AGENDAMENTO_STATUS.FOTOS_ENTREGUES,
  },
  finalizar: {
    label: 'Finalizar',
    icon: CheckCircle2,
    variant: 'default',
    confirmTitle: 'Finalizar Agendamento',
    confirmDescription: 'Confirmar a finalização do agendamento?',
    status: AGENDAMENTO_STATUS.FINALIZADO,
  },
}

export function AgendamentoActions({ agendamento }: AgendamentoActionsProps) {
  const [confirmAction, setConfirmAction] = useState<ActionType | null>(null)
  const [showPagamento, setShowPagamento] = useState(false)
  const [showReagendar, setShowReagendar] = useState(false)
  const { mutate: updateStatus, isPending } = useUpdateAgendamentoStatus()
  const { mutate: createTarefa } = useCreateTarefa()
  const { mutate: toggleDestaque, isPending: isDestaquePending } = useToggleDestaque()

  const actions = statusActions[agendamento.status] ?? []

  const handleAction = (actionType: ActionType) => {
    const config = actionConfig[actionType]

    if (actionType === 'reagendar') {
      setShowReagendar(true)
      return
    }

    if (actionType === 'pagarFinal') {
      setShowPagamento(true)
      return
    }

    if (config.confirmTitle) {
      setConfirmAction(actionType)
      return
    }
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    const config = actionConfig[confirmAction]
    updateStatus(
      { id: agendamento.id, status: config.status as Agendamento['status'] },
      {
        onSuccess: () => {
          if (config.status === AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO) {
            const dataLimite = new Date()
            dataLimite.setDate(dataLimite.getDate() + 2)
            createTarefa({
              agendamentoId: agendamento.id,
              tipo: TAREFA_TIPO.ENTREGA_FINAL,
              responsavelId: agendamento.editorId,
              dataLimite: dataLimite.toISOString(),
            })
          }
        },
        onSettled: () => setConfirmAction(null),
      },
    )
  }

  const podeDestacar =
    agendamento.status !== AGENDAMENTO_STATUS.CANCELADO &&
    agendamento.status !== AGENDAMENTO_STATUS.NO_SHOW &&
    agendamento.status !== AGENDAMENTO_STATUS.FINALIZADO

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((actionType) => {
          const config = actionConfig[actionType]
          const Icon = config.icon
          return (
            <Button
              key={actionType}
              variant={config.variant}
              size="sm"
              onClick={() => handleAction(actionType)}
              disabled={isPending}
            >
              <Icon className="mr-1 h-4 w-4" />
              {config.label}
            </Button>
          )
        })}

        {podeDestacar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDestaque(agendamento.id)}
            disabled={isDestaquePending}
          >
            <Star className={`mr-1 h-4 w-4 ${agendamento.ensaioDestaque ? 'fill-amber-400 text-amber-400' : ''}`} />
            {agendamento.ensaioDestaque ? 'Remover Destaque' : 'Destacar'}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction ? actionConfig[confirmAction].confirmTitle ?? 'Confirmar' : ''}
        description={confirmAction ? actionConfig[confirmAction].confirmDescription : ''}
        variant={confirmAction === 'cancelar' ? 'destructive' : 'default'}
        isLoading={isPending}
      />

      <RegistrarPagamentoDialog
        open={showPagamento}
        onOpenChange={setShowPagamento}
        agendamento={agendamento}
      />

      <ReagendarDialog
        open={showReagendar}
        onOpenChange={setShowReagendar}
        agendamento={agendamento}
      />
    </>
  )
}
