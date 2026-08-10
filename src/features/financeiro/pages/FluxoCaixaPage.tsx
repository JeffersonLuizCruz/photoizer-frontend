import { useMemo, useState } from 'react'
import { addMonths, format, startOfDay } from 'date-fns'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Download, Table2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { exportarCSV, exportarXLS } from '@/shared/lib/export'
import { useFluxoCaixa, useReceberReceita } from '../api/queries'
import { usePagarDespesa } from '@/features/despesas'

const PRESETS = [
  { label: 'Próximo mês', months: 1 },
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
]

function toApiDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="font-medium">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5 text-xs">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
          />
          {entry.name}
          <span className="ml-auto pl-4 font-medium tabular-nums">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO_PARCIAL: 'Parcial',
  PAGO: 'Pago',
  PAGO_TOTAL: 'Pago',
  CANCELADO: 'Cancelado',
}

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
  if (status === 'PAGO' || status === 'PAGO_TOTAL') return 'success'
  if (status === 'PAGO_PARCIAL') return 'warning'
  if (status === 'CANCELADO') return 'destructive'
  return 'warning'
}

export function FluxoCaixaPage() {
  const hoje = useMemo(() => startOfDay(new Date()), [])
  const [meses, setMeses] = useState(1)
  const [visao, setVisao] = useState<'MENSAL' | 'SEMANAL'>('MENSAL')

  const periodo = useMemo(
    () => ({
      dataInicio: toApiDate(hoje),
      dataFim: toApiDate(addMonths(hoje, meses)),
    }),
    [hoje, meses],
  )

  const { data, isLoading } = useFluxoCaixa({ ...periodo, visao })
  const receber = useReceberReceita()
  const pagar = usePagarDespesa()

  const saldoNegativo = useMemo(() => data?.buckets.some((b) => b.saldoAcumulado < 0), [data])

  const handleExportCSV = () => {
    if (!data) return
    const rows = data.buckets.map((b) => [
      b.rotulo,
      formatCurrency(b.entradasRealizadas),
      formatCurrency(b.entradasPrevistas),
      formatCurrency(b.saidasRealizadas),
      formatCurrency(b.saidasPrevistas),
      formatCurrency(b.saldoPeriodo),
      formatCurrency(b.saldoAcumulado),
    ])
    exportarCSV('fluxo-caixa.csv', ['Período', 'Entradas realizadas', 'Entradas previstas', 'Saídas realizadas', 'Saídas previstas', 'Saldo do período', 'Saldo acumulado'], rows)
  }

  const handleExportXLS = () => {
    if (!data) return
    const rows = data.buckets.map((b) => [
      b.rotulo,
      b.entradasRealizadas,
      b.entradasPrevistas,
      b.saidasRealizadas,
      b.saidasPrevistas,
      b.saldoPeriodo,
      b.saldoAcumulado,
    ])
    exportarXLS('fluxo-caixa.xls', [
      'Período',
      'Entradas realizadas',
      'Entradas previstas',
      'Saídas realizadas',
      'Saídas previstas',
      'Saldo do período',
      'Saldo acumulado',
    ], rows)
  }

  const handleReceber = (id: string) => {
    receber.mutate(id, { onSuccess: () => toast.success('Receita marcada como recebida') })
  }

  const handlePagar = (id: string) => {
    pagar.mutate(id, { onSuccess: () => toast.success('Despesa marcada como paga') })
  }

  return (
    <div>
      <PageTitle
        title="Fluxo de Caixa"
        description="Projeção de entradas e saídas por período"
        breadcrumbs={[{ label: 'Financeiro' }, { label: 'Fluxo de Caixa' }]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.months}
            size="sm"
            variant={meses === preset.months ? 'default' : 'outline'}
            onClick={() => setMeses(preset.months)}
          >
            {preset.label}
          </Button>
        ))}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            size="sm"
            variant={visao === 'MENSAL' ? 'secondary' : 'ghost'}
            onClick={() => setVisao('MENSAL')}
          >
            Mensal
          </Button>
          <Button
            size="sm"
            variant={visao === 'SEMANAL' ? 'secondary' : 'ghost'}
            onClick={() => setVisao('SEMANAL')}
          >
            Semanal
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={!data}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportXLS} disabled={!data}>
            <Table2 className="mr-1 h-4 w-4" />
            XLS
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Entradas previstas"
          value={formatCurrency(data?.entradasPrevistasTotal)}
          detail={`${formatCurrency(data?.entradasRealizadas)} realizadas`}
          icon={<ArrowUpRight className="h-4 w-4 text-emerald-500" />}
          isLoading={isLoading}
        />
        <InfoCard
          label="Saídas previstas"
          value={formatCurrency(data?.saidasPrevistasTotal)}
          detail={`${formatCurrency(data?.saidasRealizadas)} realizadas`}
          icon={<ArrowDownLeft className="h-4 w-4 text-rose-500" />}
          isLoading={isLoading}
        />
        <InfoCard
          label="Saldo projetado final"
          value={formatCurrency(data?.saldoProjetadoFinal)}
          icon={<Wallet className={cn('h-4 w-4', (data?.saldoProjetadoFinal ?? 0) < 0 ? 'text-rose-500' : 'text-violet-500')} />}
          isLoading={isLoading}
        />
        <InfoCard
          label="Período"
          value={`${formatDateBR(data?.inicio)} — ${formatDateBR(data?.fim)}`}
          icon={<Wallet className="h-4 w-4 text-slate-400" />}
          isLoading={isLoading}
        />
      </div>

      {saldoNegativo && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Atenção: há períodos com saldo projetado negativo. Considere antecipar recebimentos ou revisar despesas.
        </div>
      )}

      <div className="mb-6">
        <ChartCard
          title={visao === 'MENSAL' ? 'Projeção mensal' : 'Projeção semanal'}
          subtitle="Entradas e saídas previstas com saldo acumulado"
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.buckets ?? []} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.3} />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip content={<TooltipContent />} />
                  <Bar dataKey="entradasPrevistas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidasPrevistas" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="saldoAcumulado" name="Saldo acumulado" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Lançamentos" subtitle="Receitas e despesas no período">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Descrição</th>
                  <th className="pb-2 pr-4 font-medium">Categoria</th>
                  <th className="pb-2 pr-4 font-medium">Data</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 text-right font-medium">Valor</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(data?.itens ?? []).map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{item.descricao}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{item.categoria}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{item.data ? formatDateBR(item.data) : '—'}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium',
                          item.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {item.tipo === 'RECEITA' ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        )}
                        {item.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-medium tabular-nums">{formatCurrency(item.valor)}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={statusVariant(item.status)}>{STATUS_LABEL[item.status] ?? item.status}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      {item.tipo === 'RECEITA' &&
                        item.status !== 'PAGO_TOTAL' &&
                        item.status !== 'CANCELADO' && (
                          <Button size="sm" variant="ghost" onClick={() => handleReceber(item.id)}>
                            Receber
                          </Button>
                        )}
                      {item.tipo === 'DESPESA' && item.status !== 'PAGO' && item.status !== 'CANCELADO' && (
                        <Button size="sm" variant="ghost" onClick={() => handlePagar(item.id)}>
                          Pagar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.itens?.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum lançamento no período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  )
}

function InfoCard({
  label,
  value,
  detail,
  icon,
  isLoading,
}: {
  label: string
  value?: string
  detail?: string
  icon: React.ReactNode
  isLoading: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-32 rounded-md" />
      ) : (
        <>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
          {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
        </>
      )}
    </div>
  )
}
