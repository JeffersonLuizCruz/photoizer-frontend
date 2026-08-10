import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/lib/format'
import type { RentabilidadeServico } from '../types/dashboard.types'

interface GraficoRentabilidadeProps {
  data: RentabilidadeServico[]
  isLoading?: boolean
}

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{formatCurrency(item.value)}</p>
    </div>
  )
}

export function GraficoRentabilidade({ data, isLoading }: GraficoRentabilidadeProps) {
  if (isLoading) {
    return <Skeleton className="h-56 w-full rounded-lg" />
  }
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Sem dados de rentabilidade no período
      </div>
    )
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.3} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`)}
          />
          <YAxis
            type="category"
            dataKey="tipoServico"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<TooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
          <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[0, 4, 4, 0]} fillOpacity={0.85} barSize={14} />
          <Bar dataKey="liquido" name="Líquido" fill="#8b5cf6" radius={[0, 4, 4, 0]} fillOpacity={0.7} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
