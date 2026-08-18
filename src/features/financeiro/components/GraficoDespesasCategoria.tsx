import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/lib/format'
import type { DespesaCategoriaDado } from '../types/dashboard.types'

interface GraficoDespesasCategoriaProps {
  data: DespesaCategoriaDado[]
  isLoading?: boolean
}

function TooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="flex items-center gap-1.5 font-medium">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload.cor ?? '#94a3b8' }} />
        {item.name}
      </p>
      <p className="text-xs text-muted-foreground">{formatCurrency(item.value)}</p>
    </div>
  )
}

const fallbackColors = ['#0ea5e9', '#22c55e', '#f59e0b', '#e1749a', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']

export function GraficoDespesasCategoria({ data, isLoading }: GraficoDespesasCategoriaProps) {
  if (isLoading) {
    return <Skeleton className="h-56 w-full rounded-lg" />
  }

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Sem despesas no período
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="valor"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry.categoria} fill={entry.cor ?? fallbackColors[i % fallbackColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<TooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 space-y-1">
        {data.map((entry, i) => (
          <li key={entry.categoria} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.cor ?? fallbackColors[i % fallbackColors.length] }}
              />
              {entry.categoria}
            </span>
            <span className="font-medium">{formatCurrency(entry.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
