import { CalendarClock } from 'lucide-react'
import { useDespesasRecorrentes } from '../api/queries'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'

export function AlertaRecorrentes({ dias = 7 }: { dias?: number }) {
  const { data: recorrentes, isLoading } = useDespesasRecorrentes(dias)

  if (isLoading || !recorrentes || recorrentes.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
        <CalendarClock className="h-4 w-4" />
        Vencimentos próximos (próximos {dias} dias)
      </div>
      <ul className="mt-2 space-y-1.5">
        {recorrentes.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-amber-900 dark:text-amber-200">
              {d.descricao} — <Badge variant="warning">{d.categoria}</Badge>
            </span>
            <span className="text-amber-900 dark:text-amber-200">
              {formatCurrency(d.valor)} · vence em {formatDateBR(d.dataProximaGeracao ?? d.data)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
