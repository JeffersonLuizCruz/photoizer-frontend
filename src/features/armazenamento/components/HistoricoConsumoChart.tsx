import { format, parseISO } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatarBytes } from '@/shared/lib/bytes'
import type { SnapshotArmazenamento } from '../types/armazenamento.types'

const CORES = {
  originais: '#3b82f6',
  derivadas: '#10b981',
  documentos: '#f59e0b',
  outros: '#a78bfa',
  livre: '#0ea5e9',
} as const

interface PontoConsumo {
  rotulo: string
  Originais: number
  Derivadas: number
  Documentos: number
  Outros: number
  Livre: number
}

function paraPontos(snapshots: SnapshotArmazenamento[]): PontoConsumo[] {
  return snapshots.map((snapshot) => ({
    rotulo: format(parseISO(snapshot.data), 'dd/MM'),
    Originais: snapshot.bytesFotos,
    Derivadas: snapshot.bytesDerivados + snapshot.bytesEditadas,
    Documentos: snapshot.bytesDocumentos + snapshot.bytesPropostas,
    Outros: snapshot.bytesOutros,
    Livre: snapshot.volumeLivre,
  }))
}

function ConsumoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const livre = payload.find((item: any) => item.dataKey === 'Livre')
  const total = payload
    .filter((item: any) => item.dataKey !== 'Livre')
    .reduce((soma: number, item: any) => soma + (item.value ?? 0), 0)

  return (
    <div className="min-w-44 rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="mb-2 font-medium text-popover-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="tabular-nums">{formatarBytes(item.value)}</span>
          </div>
        ))}
        {!livre && (
          <div className="mt-1 flex items-center justify-between border-t pt-1 text-xs font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatarBytes(total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface HistoricoConsumoChartProps {
  snapshots: SnapshotArmazenamento[]
}

export function HistoricoConsumoChart({ snapshots }: HistoricoConsumoChartProps) {
  const pontos = paraPontos(snapshots)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border bg-card p-4 lg:col-span-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Consumo por categoria
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={pontos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
            <YAxis width={68} tickFormatter={(valor) => formatarBytes(valor)} tick={{ fontSize: 11 }} />
            <Tooltip content={<ConsumoTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="Originais"
              stackId="consumo"
              stroke={CORES.originais}
              fill={CORES.originais}
              fillOpacity={0.45}
            />
            <Area
              type="monotone"
              dataKey="Derivadas"
              stackId="consumo"
              stroke={CORES.derivadas}
              fill={CORES.derivadas}
              fillOpacity={0.45}
            />
            <Area
              type="monotone"
              dataKey="Documentos"
              stackId="consumo"
              stroke={CORES.documentos}
              fill={CORES.documentos}
              fillOpacity={0.45}
            />
            <Area
              type="monotone"
              dataKey="Outros"
              stackId="consumo"
              stroke={CORES.outros}
              fill={CORES.outros}
              fillOpacity={0.45}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Espaço livre no volume
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={pontos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
            <YAxis width={68} tickFormatter={(valor) => formatarBytes(valor)} tick={{ fontSize: 11 }} />
            <Tooltip content={<ConsumoTooltip />} />
            <Line
              type="monotone"
              dataKey="Livre"
              name="Livre"
              stroke={CORES.livre}
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
