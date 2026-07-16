import { Badge } from '@/shared/components/ui/badge'

type StatusType =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'paid'
  | 'partial'
  | 'overdue'

const statusConfig: Record<StatusType, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  confirmed: { label: 'Confirmado', variant: 'info' },
  in_progress: { label: 'Em Andamento', variant: 'info' },
  completed: { label: 'Concluído', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  paid: { label: 'Pago', variant: 'success' },
  partial: { label: 'Parcial', variant: 'warning' },
  overdue: { label: 'Vencido', variant: 'destructive' },
}

interface StatusBadgeProps {
  status: StatusType | string
  customLabels?: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary' }>
}

export function StatusBadge({ status, customLabels }: StatusBadgeProps) {
  const config = customLabels?.[status] ?? statusConfig[status as StatusType] ?? { label: status, variant: 'default' }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
