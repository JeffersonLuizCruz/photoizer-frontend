import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  Clock,
  DollarSign,
  Image,
  Loader2,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { extractErrorMessage } from '@/shared/api'
import { useGaleriaPerformance } from '../api/queries'
import type { GaleriaPerformance } from '../types/ecommerce.types'

const PERIODOS = [3, 6, 12]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDias(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${value} dia${value === 1 ? '' : 's'}`
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  icon: React.ElementType
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const tones = {
    default: 'border bg-card',
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-rose-200 bg-rose-50',
    info: 'border-sky-200 bg-sky-50',
  }
  return (
    <div className={cn('rounded-xl p-4', tones[tone])}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function FunilItem({
  label,
  valor,
  total,
  cor,
}: {
  label: string
  valor: number
  total: number
  cor: string
}) {
  const percentual = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {valor} de {total} · {percentual}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', cor)} style={{ width: `${percentual}%` }} />
      </div>
    </div>
  )
}

function SeriesTable({ data }: { data: GaleriaPerformance }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead>
          <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Mês</th>
            <th className="py-2 pr-3 font-medium">Galerias</th>
            <th className="py-2 pr-3 font-medium">Publicadas</th>
            <th className="py-2 pr-3 font-medium">Com extras</th>
            <th className="py-2 pr-3 font-medium">Receita extras</th>
            <th className="py-2 font-medium">Tempo até publicar</th>
          </tr>
        </thead>
        <tbody>
          {data.serieMensal.map((mes) => (
            <tr key={mes.mes} className="border-b last:border-0">
              <td className="py-2 pr-3 font-medium tabular-nums">{mes.mes}</td>
              <td className="py-2 pr-3 tabular-nums">{mes.galerias}</td>
              <td className="py-2 pr-3 tabular-nums">{mes.publicadas}</td>
              <td className="py-2 pr-3 tabular-nums">{mes.comExtras}</td>
              <td className="py-2 pr-3 tabular-nums">{formatCurrency(mes.receitaExtras)}</td>
              <td className="py-2 tabular-nums">{formatDias(mes.tempoMedioPublicacaoDias)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GaleriaPerformancePanel() {
  const [meses, setMeses] = useState(6)
  const { data, isLoading, isError, error } = useGaleriaPerformance(meses)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Desempenho da entrega</h2>
          <p className="text-xs text-muted-foreground">
            SLA, funil e extras das galerias do período selecionado.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          Período
          <select
            value={meses}
            onChange={(event) => setMeses(Number(event.target.value))}
            className="h-11 rounded-lg border bg-background px-3 text-xs font-medium text-foreground sm:h-9"
          >
            {PERIODOS.map((periodo) => (
              <option key={periodo} value={periodo}>{periodo} meses</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border bg-card py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {extractErrorMessage(error, 'Não foi possível carregar os indicadores')}
        </div>
      )}

      {!isLoading && !isError && data && data.totalGalerias === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
          <Image className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhuma galeria no período</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Amplie o período ou aguarde novos ensaios entrarem na esteira.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.totalGalerias > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              label="Tempo até publicar"
              value={formatDias(data.tempoMedioPublicacaoDias)}
              hint="ensaio → fotos publicadas"
              icon={Camera}
              tone="info"
            />
            <KpiCard
              label="Tempo de edição"
              value={formatDias(data.tempoMedioEdicaoDias)}
              hint="seleção → publicação"
              icon={Clock}
              tone="info"
            />
            <KpiCard
              label="Tempo até liberação"
              value={formatDias(data.tempoMedioEntregaDias)}
              hint="ensaio → seleção publicada"
              icon={Timer}
              tone="info"
            />
            <KpiCard
              label="Atrasadas no período"
              value={String(data.atrasadas)}
              hint="prazo do pacote vencido"
              icon={AlertTriangle}
              tone={data.atrasadas > 0 ? 'danger' : 'success'}
            />
            <KpiCard
              label="Receita de extras"
              value={formatCurrency(data.receitaExtras)}
              hint={`${data.totalComprasPagas} compra(s) paga(s)`}
              icon={DollarSign}
              tone="success"
            />
            <KpiCard
              label="Extras por galeria"
              value={data.extrasPorGaleria.toFixed(2)}
              hint={`${data.totalFotosExtras} foto(s) extra(s)`}
              icon={Image}
            />
            <KpiCard
              label="Conversão de extras"
              value={`${data.conversaoExtras.toFixed(1)}%`}
              hint="comercializadas com extras"
              icon={TrendingUp}
              tone={data.conversaoExtras > 0 ? 'success' : 'default'}
            />
            <KpiCard
              label="Ticket médio"
              value={formatCurrency(data.ticketMedioExtras)}
              hint="por compra de extras"
              icon={DollarSign}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">Funil de galerias</h3>
              <p className="mb-4 mt-0.5 text-[11px] text-muted-foreground">
                {data.totalGalerias} galeria(s) no período
              </p>
              <div className="space-y-4">
                <FunilItem label="Fotos publicadas" valor={data.publicadas} total={data.totalGalerias} cor="bg-sky-500" />
                <FunilItem label="Com seleção do cliente" valor={data.comSelecao} total={data.totalGalerias} cor="bg-primary" />
                <FunilItem label="Comercializadas" valor={data.comercializadas} total={data.totalGalerias} cor="bg-emerald-500" />
                <FunilItem label="Com extras pagos" valor={data.comExtras} total={data.comercializadas} cor="bg-amber-500" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">Explicação dos indicadores</h3>
              <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                <li><strong className="text-foreground">Tempo até publicar:</strong> da realização do ensaio até a primeira publicação das fotos.</li>
                <li><strong className="text-foreground">Tempo de edição:</strong> do envio da seleção pelo cliente até a publicação da edição/aprovação.</li>
                <li><strong className="text-foreground">Tempo até liberação:</strong> da realização do ensaio até a seleção publicada (liberação para o cliente).</li>
                <li><strong className="text-foreground">Conversão de extras:</strong> galerias comercializadas que tiveram ao menos uma compra paga.</li>
                <li>Médias consideram apenas galerias com as datas disponíveis; “—” indica ausência de amostra.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Série mensal</h3>
            <SeriesTable data={data} />
          </div>
        </>
      )}
    </div>
  )
}
