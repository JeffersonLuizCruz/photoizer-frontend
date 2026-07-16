import { PiggyBank, CreditCard, ImagePlus, TrendingUp } from 'lucide-react'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

interface FinanceiroResumoProps {
  agendamentos: Agendamento[]
}

const statusComPagamentoFinal = [
  AGENDAMENTO_STATUS.EM_EDICAO,
  AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO,
  AGENDAMENTO_STATUS.FOTOS_ENTREGUES,
  AGENDAMENTO_STATUS.FINALIZADO,
]

export function FinanceiroResumo({ agendamentos }: FinanceiroResumoProps) {
  const totalEntradas = agendamentos.reduce((acc, a) => acc + a.valorEntradaPago, 0)

  const totalFinal = agendamentos
    .filter((a) => statusComPagamentoFinal.includes(a.status))
    .reduce((acc, a) => acc + a.valorRestante, 0)

  const totalExtras = agendamentos.reduce((acc, a) => acc + a.valorExtras, 0)

  const faturamentoTotal = agendamentos
    .filter((a) => a.status !== AGENDAMENTO_STATUS.CANCELADO && a.status !== AGENDAMENTO_STATUS.NO_SHOW)
    .reduce((acc, a) => acc + a.valorTotalFinal, 0)

  const cards = [
    {
      icon: PiggyBank,
      label: 'Total de Entradas (30%)',
      value: totalEntradas,
      variant: 'text-emerald-600 dark:text-emerald-400' as const,
    },
    {
      icon: CreditCard,
      label: 'Total Pagamentos Finais (70%)',
      value: totalFinal,
      variant: 'text-blue-600 dark:text-blue-400' as const,
    },
    {
      icon: ImagePlus,
      label: 'Total de Extras',
      value: totalExtras,
      variant: 'text-purple-600 dark:text-purple-400' as const,
    },
    {
      icon: TrendingUp,
      label: 'Faturamento Total',
      value: faturamentoTotal,
      variant: 'text-amber-600 dark:text-amber-400' as const,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className={`h-4 w-4 ${card.variant}`} />
              {card.label}
            </div>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${card.variant}`}>
              R$ {card.value.toFixed(2)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
