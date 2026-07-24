import { Badge } from '@/shared/components/ui/badge'
import type { StatusFotoEdicao } from '../types'

const config: Record<StatusFotoEdicao, { label: string; variant: 'warning' | 'success' | 'default' | 'secondary' }> = {
  RAW: { label: 'RAW', variant: 'warning' },
  EM_EDICAO: { label: 'Editando', variant: 'secondary' },
  EDITADO: { label: 'Editado', variant: 'success' },
}

interface FotoEdicaoStatusBadgeProps {
  status: StatusFotoEdicao
}

export function FotoEdicaoStatusBadge({ status }: FotoEdicaoStatusBadgeProps) {
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}
