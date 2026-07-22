import { PiggyBank, TrendingUp, DollarSign, Target, Info, BarChart3 } from 'lucide-react'
import {
  Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart,
} from 'recharts'
import { useFinanceiroMensal } from '../api/queries'

const currencyFormat = (v: number | null | undefined): string => {
  if (v == null || isNaN(v)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const recebido = payload.find((p: any) => p.name === 'Recebido')?.value ?? 0
  const pendente = payload.find((p: any) => p.name === 'Pendente')?.value ?? 0
  const faturamento = recebido + pendente
  const liquido = payload.find((p: any) => p.name === 'Líquido Previsto')?.value

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm min-w-[200px]">
      <p className="font-medium mb-2 text-popover-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
            Recebido
          </span>
          <span className="font-medium tabular-nums">{currencyFormat(recebido)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" />
            Pendente
          </span>
          <span className="font-medium tabular-nums">{currencyFormat(pendente)}</span>
        </div>
        <div className="border-t pt-1 mt-1 flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Faturamento</span>
          <span className="tabular-nums">{currencyFormat(faturamento)}</span>
        </div>
        {liquido !== undefined && (
          <div className="flex items-center justify-between text-xs border-t pt-1 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500 inline-block" />
              Líquido Previsto
            </span>
            <span className="font-medium tabular-nums">{currencyFormat(liquido)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricDef {
  label: string
  description: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  border: string
  suffix?: string
}

function MetricCard({ metric: m }: { metric: MetricDef }) {
  const Icon = m.icon
  const display = m.suffix ? `${m.value}${m.suffix}` : currencyFormat(m.value)
  return (
    <div className={`relative rounded-lg border ${m.border} ${m.bg} p-3 group`}>
      <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{m.label}</span>
        </div>
        <Info className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity cursor-help" />
      </div>
      <p className={`text-lg font-bold tabular-nums leading-tight ${m.color}`}>{display}</p>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md whitespace-nowrap">
          {m.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
        </div>
      </div>
    </div>
  )
}

export function GraficoMensal() {
  const { data, isLoading } = useFinanceiroMensal(6)

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-2 w-full bg-muted rounded-full" />
          <div className="h-72 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
        <BarChart3 className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm">Nenhum dado disponível</p>
      </div>
    )
  }

  const { mesAtual, historico } = data

  const pendente = (mesAtual.valorTotalConfirmados ?? 0) - (mesAtual.entradasRecebidas ?? 0)
  const pctRealizado = (mesAtual.valorTotalConfirmados ?? 0) > 0
    ? Math.round(((mesAtual.valorTotalFinalizados ?? 0) / (mesAtual.valorTotalConfirmados ?? 0)) * 100)
    : 0

  const chartData = historico.map((h) => {
    const pend = (h.valorConfirmados ?? 0) - (h.entradasRecebidas ?? 0)
    return {
      mes: h.mes.slice(5),
      Recebido: h.entradasRecebidas ?? 0,
      Pendente: pend,
      faturamento: h.valorConfirmados ?? 0,
      'Líquido Previsto': h.liquidoPrevisto ?? 0,
    }
  })

  const metrics: MetricDef[] = [
    {
      label: 'Faturamento do Mês',
      description: 'Valor total (100%) de todos os agendamentos confirmados, incluindo taxa de deslocamento',
      value: mesAtual.valorTotalConfirmados ?? 0,
      icon: BarChart3,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      label: 'Recebido',
      description: 'Total dos 30% de entrada já pagos pelos clientes nos agendamentos confirmados',
      value: mesAtual.entradasRecebidas ?? 0,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'Pendente',
      description: 'Saldo restante a receber — valor total dos confirmados menos o que já foi pago',
      value: pendente ?? 0,
      icon: Target,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: 'Líquido Atual',
      description: 'Entradas recebidas menos despesas de deslocamento — o saldo disponível hoje',
      value: mesAtual.liquidoAtual ?? 0,
      icon: PiggyBank,
      color: (mesAtual.liquidoAtual ?? 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Líquido Previsto',
      description: 'Projeção para o fim do mês: faturamento total menos despesas de deslocamento',
      value: mesAtual.liquidoPrevisto ?? 0,
      icon: TrendingUp,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200 dark:border-violet-800',
    },
  ]

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h2 className="text-base font-semibold">Acompanhamento Mensal</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {mesAtual.totalAgendamentos ?? 0} agendamento(s) no mês — {mesAtual.confirmados ?? 0} confirmado(s), {mesAtual.finalizados ?? 0} finalizado(s)
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso de finalizados</span>
            <span>{mesAtual.finalizados ?? 0} de {mesAtual.confirmados ?? 0} ({pctRealizado}%)</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${Math.min(pctRealizado, 100)}%` }}
            />
          </div>
        </div>

        <div className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="gradLiquido" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.3} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              <Bar stackId="a" dataKey="Recebido" fill="#10b981" radius={[0, 0, 0, 0]} fillOpacity={0.85} />
              <Bar stackId="a" dataKey="Pendente" fill="#fbbf24" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
              <Line
                type="monotone"
                dataKey="Líquido Previsto"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                name="Líquido Previsto"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
