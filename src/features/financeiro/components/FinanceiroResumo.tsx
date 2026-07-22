import { PiggyBank, CreditCard, ImagePlus, TrendingUp, Loader2, ArrowDownFromLine, Handshake } from 'lucide-react'
import type { FinanceiroResumo as FinanceiroResumoData } from '../services/financeiro.service'

interface FinanceiroResumoProps {
  data: FinanceiroResumoData | undefined
  isLoading: boolean
}

export function FinanceiroResumo({ data, isLoading }: FinanceiroResumoProps) {
  const totalDespesas = (data?.despesasDeslocamento ?? 0) + (data?.despesasComissao ?? 0)

  const cards = [
    {
      icon: PiggyBank,
      label: 'Total de Entradas (30%)',
      value: data?.totalEntradas ?? 0,
      variant: 'text-emerald-600 dark:text-emerald-400' as const,
    },
    {
      icon: CreditCard,
      label: 'Total Pagamentos Finais (70%)',
      value: data?.totalFinal ?? 0,
      variant: 'text-blue-600 dark:text-blue-400' as const,
    },
    {
      icon: ImagePlus,
      label: 'Total de Extras',
      value: data?.totalExtras ?? 0,
      variant: 'text-purple-600 dark:text-purple-400' as const,
    },
    {
      icon: TrendingUp,
      label: 'Faturamento Total',
      value: data?.faturamentoTotal ?? 0,
      variant: 'text-amber-600 dark:text-amber-400' as const,
    },
    {
      icon: ArrowDownFromLine,
      label: 'Despesas (Deslocamento)',
      value: data?.despesasDeslocamento ?? 0,
      variant: 'text-rose-600 dark:text-rose-400' as const,
    },
    {
      icon: Handshake,
      label: 'Despesas (Comissões)',
      value: data?.despesasComissao ?? 0,
      variant: 'text-rose-500 dark:text-rose-300' as const,
    },
    {
      icon: TrendingUp,
      label: 'Saldo Líquido (Fat. - Desp.)',
      value: (data?.faturamentoTotal ?? 0) - totalDespesas,
      variant: 'text-violet-600 dark:text-violet-400' as const,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className={`h-4 w-4 ${card.variant}`} />
              {card.label}
            </div>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${card.variant}`}>
              {isLoading && !data ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `R$ ${card.value.toFixed(2)}`
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
