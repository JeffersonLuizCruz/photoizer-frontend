import { ReceitaFormDialog } from '@/features/financeiro/components/ReceitaFormDialog'

interface RegistrarRecebimentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamentoId: string
  agendamentoLabel: string
}

export function RegistrarRecebimentoDialog({
  open,
  onOpenChange,
  agendamentoId,
  agendamentoLabel,
}: RegistrarRecebimentoDialogProps) {
  return (
    <ReceitaFormDialog
      open={open}
      onOpenChange={onOpenChange}
      agendamentoFixoId={agendamentoId}
      agendamentoFixoLabel={agendamentoLabel}
    />
  )
}
