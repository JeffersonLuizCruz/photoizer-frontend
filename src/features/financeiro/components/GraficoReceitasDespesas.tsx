import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/lib/format'
import type { DadoMensal } from '../types/dashboard.types'

interface GraficoReceitasDespesasProps {
  data: DadoMensal[]
  isLoading?: boolean
}

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <p className="flex items-center justify-between gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Receitas
        </span>
        <span className="font-medium tabular-nums">{formatCurrency(payload[0]?.value)}</span>
      </p>
      <p className="flex items-center justify-between gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
          Despesas
        </span>
        <span className="font-medium tabular-nums">{formatCurrency(payload[1]?.value)}</span>
      </p>
    </div>
  )
}

export function GraficoReceitasDespesas({ data, isLoading }: GraficoReceitasDespesasProps) {
  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-56 w-full" /></div>
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
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
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
          <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
          <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} fillOpacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
