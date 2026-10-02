import { useState } from 'react'
import {
  Play,
  RotateCcw,
  XCircle,
  Ban,
  CreditCard,
  CheckCircle2,
  Star,
  ArrowLeftRight,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'
import { ReagendarDialog } from './ReagendarDialog'
import { TransferirEnsaioDialog } from './TransferirEnsaioDialog'
import { ConflitoAgendaDialog } from './ConflitoAgendaDialog'
import { useUpdateAgendamentoStatus, useToggleDestaque, useConfirmarPagamentoAgendamento, useAprovarAgendamento } from '../api/queries'
import { useAuth } from '@/features/auth/AuthProvider'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '../types'

interface AgendamentoActionsProps {
  agendamento: Agendamento
}

type ActionType = 'realizar' | 'reagendar' | 'cancelar' | 'noShow' | 'pagarFinal' | 'finalizar' | 'confirmarPagamento' | 'aprovar'

const statusActions: Record<string, ActionType[]> = {
  [AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO]: ['confirmarPagamento', 'cancelar'],
  [AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO]: ['aprovar', 'cancelar'],
  [AGENDAMENTO_STATUS.CONFIRMADO]: ['realizar', 'reagendar', 'cancelar', 'noShow'],
  [AGENDAMENTO_STATUS.REALIZADO]: ['pagarFinal', 'cancelar'],
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: ['pagarFinal'],
  [AGENDAMENTO_STATUS.EM_EDICAO]: ['finalizar'],
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
  finalizar: {
    label: 'Finalizar',
    icon: CheckCircle2,
    variant: 'default',
    confirmTitle: 'Finalizar Agendamento',
    confirmDescription: 'Confirmar a finalização do agendamento?',
    status: AGENDAMENTO_STATUS.FINALIZADO,
  },
  confirmarPagamento: {
    label: 'Confirmar Pagamento',
    icon: CreditCard,
    variant: 'default',
    status: AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO,
  },
  aprovar: {
    label: 'Aprovar',
    icon: CheckCircle2,
    variant: 'default',
    status: AGENDAMENTO_STATUS.CONFIRMADO,
  },
}

export function AgendamentoActions({ agendamento }: AgendamentoActionsProps) {
  const [confirmAction, setConfirmAction] = useState<ActionType | null>(null)
  const [showPagamento, setShowPagamento] = useState(false)
  const [showReagendar, setShowReagendar] = useState(false)
  const [showTransferir, setShowTransferir] = useState(false)
  const [showConflito, setShowConflito] = useState(false)
  const { papel } = useAuth()
  const isAdmin = papel === 'ADMIN'
  const { mutate: updateStatus, isPending } = useUpdateAgendamentoStatus()
  const { mutate: toggleDestaque, isPending: isDestaquePending } = useToggleDestaque()
  const { mutate: confirmarPagamento, isPending: confirmarPending } = useConfirmarPagamentoAgendamento()
  const { mutate: aprovar, isPending: aprovarPending } = useAprovarAgendamento()

  const actions = (statusActions[agendamento.status] ?? []).filter(
    (actionType) => isAdmin || (actionType !== 'reagendar' && actionType !== 'cancelar'),
  )

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

    if (actionType === 'confirmarPagamento') {
      confirmarPagamento(agendamento.id)
      return
    }

    if (actionType === 'aprovar') {
      aprovar(agendamento.id, {
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 409) {
            setShowConflito(true)
          }
        },
      })
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
              disabled={isPending || confirmarPending || aprovarPending}
            >
              <Icon className="mr-1 h-4 w-4" />
              {config.label}
            </Button>
          )
        })}

        {isAdmin && agendamento.status === AGENDAMENTO_STATUS.CONFIRMADO && (
          <Button variant="outline" size="sm" onClick={() => setShowTransferir(true)}>
            <ArrowLeftRight className="mr-1 h-4 w-4" />
            Transferir
          </Button>
        )}

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
        variant={confirmAction === 'cancelar' || confirmAction === 'noShow' ? 'destructive' : 'default'}
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

      <TransferirEnsaioDialog
        open={showTransferir}
        onOpenChange={setShowTransferir}
        agendamento={agendamento}
      />

      <ConflitoAgendaDialog
        open={showConflito}
        onOpenChange={setShowConflito}
        agendamento={agendamento}
      />
    </>
  )
}
