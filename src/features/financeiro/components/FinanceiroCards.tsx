import { ArrowDownRight, ArrowUpRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/lib/format'
import type { CardsResumo, Detalhamento, VariacaoCards } from '../types/dashboard.types'

interface FinanceiroCardsProps {
  cards?: CardsResumo
  isLoading?: boolean
}

function margemBadge(margem: number): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (margem > 0.6) return { label: 'Saudável', variant: 'success' }
  if (margem >= 0.3) return { label: 'Moderado', variant: 'warning' }
  return { label: 'Atenção', variant: 'destructive' }
}

function DetalhamentoRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{formatCurrency(value)}</span>
    </div>
  )
}

function DetalhamentoBreakdown({ detalhamento }: { detalhamento: Detalhamento }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">Composição do Líquido Previsto</h3>
        <span className="text-xs text-muted-foreground">Detalhamento por fonte</span>
      </div>
      <div className="grid gap-x-8 gap-y-1 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <DetalhamentoRow label="Entrada (30%) — Ensaios" value={detalhamento.entradaEnsaios} />
          <DetalhamentoRow label="Restante (70%) — Ensaios" value={detalhamento.restanteEnsaios} />
          <DetalhamentoRow label="Receitas Avulsas" value={detalhamento.receitasAvulsas} />
        </div>
        <div>
          <DetalhamentoRow label="Total Recebido" value={detalhamento.recebido} />
          <DetalhamentoRow label="Comissão (indicação)" value={detalhamento.comissao} />
          <DetalhamentoRow label="Deslocamento (efetivo)" value={detalhamento.deslocamento} />
          <DetalhamentoRow label="Repasse (parceiros)" value={detalhamento.repasses} />
          <DetalhamentoRow label="Despesas" value={detalhamento.despesas} />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Líquido previsto = Valor bruto − (deslocamento efetivo + comissão + repasse de parceiros + despesas).
        Deslocamento repassado ao fotógrafo não é descontado.
      </p>
    </div>
  )
}

function Variacao({
  value,
  invertSignal = false,
}: {
  value: number | null | undefined
  invertSignal?: boolean
}) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  const good = invertSignal ? value < 0 : value > 0
  const bad = invertSignal ? value > 0 : value < 0
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        good ? 'text-emerald-600 dark:text-emerald-400' : bad ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(0)}% vs. período anterior
    </span>
  )
}

function Card({
  label,
  value,
  icon: Icon,
  variacao,
  invertSignal,
  hint,
  children,
}: {
  label: string
  value?: number
  icon: React.ElementType
  variacao?: number | null
  invertSignal?: boolean
  hint?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {value !== undefined ? formatCurrency(value) : '—'}
      </p>
      <div className="mt-1">
        {variacao !== undefined && <Variacao value={variacao} invertSignal={invertSignal} />}
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export function FinanceiroCards({ cards, isLoading }: FinanceiroCardsProps) {
  if (isLoading || !cards) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
    )
  }

  const v: VariacaoCards | null = cards.variacoes

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <Card
        label="Valor Bruto"
        value={cards.valorBruto}
        icon={TrendingUp}
        variacao={v?.valorBruto}
        hint={`${cards.qtdTrabalhos} trabalho(s)`}
      />
      <Card
        label="Despesas Totais"
        value={cards.despesasTotais}
        icon={TrendingDown}
        variacao={v?.despesasTotais}
        invertSignal
      />
      <Card
        label="Líquido Previsto"
        value={cards.liquidoPrevisto}
        icon={TrendingUp}
        variacao={v?.liquidoPrevisto}
      />
      <Card
        label="Líquido Realizado"
        value={cards.liquidoRealizado}
        icon={TrendingUp}
        variacao={v?.liquidoRealizado}
        hint="Receitas recebidas − despesas pagas"
      />
      <Card label="A Receber" value={cards.aReceber} icon={TrendingUp} hint="Receitas pendentes" />
      <Card label="Ticket Médio" value={cards.ticketMedio} icon={TrendingUp} hint="Receita por trabalho" />
      <Card label="Margem de Lucro" value={cards.margemLucro} icon={TrendingUp} hint="Líquido / Valor bruto">
        <Badge variant={margemBadge(cards.margemLucro).variant} className="mt-1">
          {margemBadge(cards.margemLucro).label}
        </Badge>
      </Card>
      <Card label="Qtd. de Trabalhos" icon={TrendingUp}>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{cards.qtdTrabalhos}</p>
      </Card>

      {cards.detalhamento && <DetalhamentoBreakdown detalhamento={cards.detalhamento} />}
    </div>
  )
}
