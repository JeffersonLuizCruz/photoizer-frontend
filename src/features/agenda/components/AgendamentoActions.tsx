import { useState } from 'react'
import {
  Play,
  RotateCcw,
  XCircle,
  Ban,
  CreditCard,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button } from '@/shared/components/ui/button'
import { StickyActionBar } from '@/shared/components/mobile'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'
import { ReagendarDialog } from './ReagendarDialog'
import { TransferirEnsaioDialog } from './TransferirEnsaioDialog'
import { ConflitoAgendaDialog } from './ConflitoAgendaDialog'
import { useUpdateAgendamentoStatus, useConfirmarPagamentoAgendamento, useAprovarAgendamento } from '../api/queries'
import { useAuth } from '@/features/auth/AuthProvider'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '../types'

interface AgendamentoActionsProps {
  agendamento: Agendamento
}

type ActionType = 'realizar' | 'reagendar' | 'cancelar' | 'noShow' | 'pagarFinal' | 'finalizar' | 'confirmarPagamento' | 'aprovar' | 'enviarEdicao'

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
  enviarEdicao: {
    label: 'Enviar para edição',
    icon: CheckCircle2,
    variant: 'default',
    confirmTitle: 'Enviar para edição',
    confirmDescription: 'O pagamento já está quitado. Deseja iniciar a edição sem registrar novo pagamento?',
    status: AGENDAMENTO_STATUS.EM_EDICAO,
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
  const { mutate: confirmarPagamento, isPending: confirmarPending } = useConfirmarPagamentoAgendamento()
  const { mutate: aprovar, isPending: aprovarPending } = useAprovarAgendamento()

  const entradaQuitada =
    agendamento.valorEntradaPago > 0 &&
    agendamento.valorEntradaPago >= agendamento.valorEntradaExigido
  const acoesDoStatus: ActionType[] =
    agendamento.status === AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO && entradaQuitada
      ? ['aprovar', 'cancelar']
      : statusActions[agendamento.status] ?? []
  const actions = acoesDoStatus.filter(
    (actionType) => isAdmin || (actionType !== 'reagendar' && actionType !== 'cancelar'),
  )

  if (agendamento.valorRestante <= 0
    && (agendamento.status === AGENDAMENTO_STATUS.REALIZADO
      || agendamento.status === AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL)) {
    const indice = actions.indexOf('pagarFinal')
    if (indice >= 0) actions.splice(indice, 1)
    if (!actions.includes('enviarEdicao')) actions.unshift('enviarEdicao')
  }

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

  const temTransferir = isAdmin && agendamento.status === AGENDAMENTO_STATUS.CONFIRMADO

  if (actions.length === 0 && !temTransferir) {
    return null
  }

  return (
    <>
      <StickyActionBar>
        <div className="flex w-full snap-x items-center gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,black_calc(100%_-_1.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2">
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

            {temTransferir && (
              <Button variant="outline" size="sm" onClick={() => setShowTransferir(true)}>
                <ArrowLeftRight className="mr-1 h-4 w-4" />
                Transferir
              </Button>
            )}
          </div>
        </div>
      </StickyActionBar>

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
