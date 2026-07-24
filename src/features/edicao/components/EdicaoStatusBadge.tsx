import { Badge } from '@/shared/components/ui/badge'
import type { StatusEdicao } from '../types'

const config: Record<StatusEdicao, { label: string; variant: 'warning' | 'info' | 'success' | 'default' | 'secondary' }> = {
  AGUARDANDO_RAW: { label: 'Aguardando RAW', variant: 'warning' },
  RAW_ENVIADOS: { label: 'RAW Enviados', variant: 'info' },
  EM_EDICAO: { label: 'Em Edição', variant: 'info' },
  EDICAO_CONCLUIDA: { label: 'Edição Concluída', variant: 'success' },
}

interface EdicaoStatusBadgeProps {
  status: StatusEdicao
}

export function EdicaoStatusBadge({ status }: EdicaoStatusBadgeProps) {
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}
