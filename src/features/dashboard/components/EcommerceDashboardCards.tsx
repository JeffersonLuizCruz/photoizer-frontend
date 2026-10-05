import { useNavigate } from 'react-router-dom'
import { ShoppingCart, DollarSign, Camera, TrendingUp, Loader2 } from 'lucide-react'
import { KpiCard, KpiGrid } from '@/shared/components/mobile'
import { ROUTES } from '@/shared/constants'
import { useDashboardEcommerce } from '../api/queries'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function EcommerceDashboardCards() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardEcommerce()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const irParaEcommerce = () => navigate(ROUTES.ADMIN_ECOMMERCE)

  return (
    <div>
      <KpiGrid className="md:grid-cols-4">
        <KpiCard
          label="Compras"
          value={data.totalCompras}
          icon={<ShoppingCart className="h-4 w-4" aria-hidden="true" />}
          onClick={irParaEcommerce}
        />
        <KpiCard
          label="Fotos Extras"
          value={data.totalFotosExtras}
          icon={<Camera className="h-4 w-4" aria-hidden="true" />}
          onClick={irParaEcommerce}
        />
        <KpiCard
          label="Faturado"
          value={formatCurrency(data.totalFaturado)}
          tone="success"
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          onClick={irParaEcommerce}
        />
        <KpiCard
          label="Ticket Médio"
          value={formatCurrency(data.ticketMedio)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          onClick={irParaEcommerce}
        />
      </KpiGrid>

      {data.topClientes.length > 0 && (
        <div className="mt-3 rounded-lg border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">TOP CLIENTES</p>
          <div className="space-y-1.5">
            {data.topClientes.map((cliente, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                  <span className="truncate font-medium">{cliente.nomeCliente}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">{cliente.quantidadeCompras} compra(s)</span>
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
