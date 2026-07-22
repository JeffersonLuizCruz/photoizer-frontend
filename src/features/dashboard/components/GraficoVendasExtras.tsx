import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart } from 'recharts'
import { useDashboardEcommerceMensal } from '../api/queries'

const currencyFormat = (v: number | null | undefined): string => {
  if (v == null || isNaN(v)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const valor = payload.find((p: any) => p.name === 'Valor')?.value ?? 0
  const fotos = payload.find((p: any) => p.name === 'Fotos')?.value ?? 0
  const compras = payload.find((p: any) => p.name === 'Compras')?.value ?? 0

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm min-w-[180px]">
      <p className="font-medium mb-2 text-popover-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />
            Valor
          </span>
          <span className="font-medium tabular-nums">{currencyFormat(valor)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
            Fotos
          </span>
          <span className="font-medium tabular-nums">{fotos}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" />
            Compras
          </span>
          <span className="font-medium tabular-nums">{compras}</span>
        </div>
      </div>
    </div>
  )
}

export function GraficoVendasExtras() {
  const { data, isLoading } = useDashboardEcommerceMensal(6)

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="h-[200px] bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!data || data.historico.length === 0) return null

  const chartData = data.historico.map((item) => ({
    mes: item.mes.slice(5, 7) + '/' + item.mes.slice(0, 4),
    Valor: item.valorTotal,
    Fotos: item.quantidadeFotos,
    Compras: item.quantidadeCompras,
  }))

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-4">Vendas de Extras (Mensal)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip content={<ChartTooltip />} />
          <Bar yAxisId="left" dataKey="Valor" name="Valor" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="Fotos" name="Fotos" fill="var(--color-emerald-500)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
