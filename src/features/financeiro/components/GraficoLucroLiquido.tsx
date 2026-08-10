import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/lib/format'
import type { DadoLucroMensal } from '../types/dashboard.types'

interface GraficoLucroLiquidoProps {
  data: DadoLucroMensal[]
  isLoading?: boolean
}

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <p className="flex items-center gap-1.5 text-xs">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
        Líquido
        <span className="ml-auto pl-4 font-medium tabular-nums">{formatCurrency(payload[0]?.value)}</span>
      </p>
    </div>
  )
}

export function GraficoLucroLiquido({ data, isLoading }: GraficoLucroLiquidoProps) {
  if (isLoading) {
    return <Skeleton className="h-56 w-full rounded-lg" />
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.3} />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`)}
          />
          <Tooltip content={<TooltipContent />} />
          <Line
            type="monotone"
            dataKey="liquido"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
