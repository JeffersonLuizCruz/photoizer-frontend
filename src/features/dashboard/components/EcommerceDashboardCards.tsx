import { ShoppingCart, DollarSign, Camera, TrendingUp, Loader2 } from 'lucide-react'
import { useDashboardEcommerce } from '../api/queries'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function EcommerceDashboardCards() {
  const { data, isLoading } = useDashboardEcommerce()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Compras</p>
        </div>
        <p className="text-xl font-bold">{data.totalCompras}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Fotos Extras</p>
        </div>
        <p className="text-xl font-bold">{data.totalFotosExtras}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Faturado</p>
        </div>
        <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.totalFaturado)}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Ticket Médio</p>
        </div>
        <p className="text-xl font-bold">{formatCurrency(data.ticketMedio)}</p>
      </div>

      {data.topClientes.length > 0 && (
        <div className="col-span-full rounded-lg border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">TOP CLIENTES</p>
          <div className="space-y-1.5">
            {data.topClientes.map((cliente, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono w-4">#{i + 1}</span>
                  <span className="font-medium">{cliente.nomeCliente}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{cliente.quantidadeCompras} compra(s)</span>
                  <span className="font-medium text-foreground">{formatCurrency(cliente.totalGasto)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
