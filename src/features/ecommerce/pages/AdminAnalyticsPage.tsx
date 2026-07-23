import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, DollarSign, Camera, TrendingUp, Star, Users, Loader2 } from 'lucide-react'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import { PageTitle } from '@/shared/components/layout/PageTitle'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function StatusCard({ title, value, icon: Icon, subtitle, variant }: {
  title: string
  value: string
  icon: React.ElementType
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'info'
}) {
  const colors = {
    default: 'bg-card border-border',
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  }
  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  }

  return (
    <div className={`rounded-xl border p-4 ${colors[variant ?? 'default']}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 ${iconColors[variant ?? 'default']}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-xs text-right font-medium">{formatNumber(value)}</span>
    </div>
  )
}

export function AdminAnalyticsPage() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => ecommerceService.adminAnalytics(),
  })

  const { data: ecommerce, isLoading: loadingEcommerce } = useQuery({
    queryKey: ['dashboard-ecommerce'],
    queryFn: () => ecommerceService.dashboardEcommerce(),
  })

  const { data: mensal, isLoading: loadingMensal } = useQuery({
    queryKey: ['dashboard-ecommerce-mensal', 6],
    queryFn: () => ecommerceService.dashboardEcommerceMensal(6),
  })

  const isLoading = loadingAnalytics || loadingEcommerce || loadingMensal

  if (isLoading) {
    return (
      <div>
        <PageTitle title="Analytics" breadcrumbs={[{ label: 'Admin', href: '/admin/ecommerce' }, { label: 'Analytics' }]} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!analytics || !ecommerce) {
    return (
      <div>
        <PageTitle title="Analytics" breadcrumbs={[{ label: 'Admin', href: '/admin/ecommerce' }, { label: 'Analytics' }]} />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <TrendingUp className="h-10 w-10 mb-3" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  const maxValorMensal = mensal?.historico?.length
    ? Math.max(...mensal.historico.map(h => h.valorTotal), 1)
    : 1

  const maxComprasMensal = mensal?.historico?.length
    ? Math.max(...mensal.historico.map(h => h.quantidadeCompras), 1)
    : 1

  return (
    <div>
      <PageTitle title="Analytics" breadcrumbs={[{ label: 'Admin', href: '/admin/ecommerce' }, { label: 'Analytics' }]} />

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Total de Pedidos"
            value={formatNumber(analytics.totalPedidos)}
            icon={ShoppingCart}
            variant="info"
          />
          <StatusCard
            title="Receita Total"
            value={formatCurrency(analytics.receitaTotal)}
            icon={DollarSign}
            variant="success"
            subtitle={`${formatCurrency(analytics.receitaExtras)} em extras`}
          />
          <StatusCard
            title="Fotos Comercializadas"
            value={formatNumber(analytics.totalFotosSelecionadas + analytics.totalFotosVendidasExtras)}
            icon={Camera}
            variant="warning"
            subtitle={`${formatNumber(analytics.totalFotosVendidasExtras)} extras vendidas`}
          />
          <StatusCard
            title="Taxa de Conversão"
            value={`${(analytics.taxaConversaoExtras * 100).toFixed(1)}%`}
            icon={TrendingUp}
            variant={analytics.taxaConversaoExtras > 0.3 ? 'success' : 'default'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Vendas Mensais</h3>
            {mensal?.historico?.length ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-1">Valor total</p>
                {mensal.historico.map((item) => (
                  <div key={item.mes} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-muted-foreground">{item.mes}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 bg-primary rounded transition-all"
                          style={{ width: `${(item.valorTotal / maxValorMensal) * 100}%` }}
                        />
                        <span className="text-xs font-medium">{formatCurrency(item.valorTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4 mb-1">Quantidade de compras</p>
                {mensal.historico.map((item) => (
                  <div key={item.mes} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-muted-foreground">{item.mes}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 bg-blue-400 dark:bg-blue-500 rounded transition-all"
                          style={{ width: `${(item.quantidadeCompras / maxComprasMensal) * 100}%` }}
                        />
                        <span className="text-xs font-medium">{item.quantidadeCompras} compras</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado mensal disponível</p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Pedidos por Status</h3>
            {Object.keys(analytics.pedidosPorStatus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.pedidosPorStatus).map(([status, qtd]) => (
                  <MiniBar
                    key={status}
                    label={status}
                    value={qtd}
                    max={Math.max(...Object.values(analytics.pedidosPorStatus), 1)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Fotos Mais Selecionadas
            </h3>
            {analytics.fotosMaisSelecionadas.length > 0 ? (
              <div className="space-y-2">
                {analytics.fotosMaisSelecionadas.map((foto) => (
                  <div key={foto.fotoId} className="flex items-center gap-3 rounded-lg border p-2">
                    <div className="h-10 w-10 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                      {foto.thumbUrl ? (
                        <img src={foto.thumbUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-5 w-5 m-auto text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{foto.fileName}</p>
                      <div className="flex gap-2 mt-0.5">
                        {foto.selecionadaPacote && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Pacote</span>
                        )}
                        {foto.vendidaExtra && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded">Extra</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma foto popular</p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Top Clientes
            </h3>
            {ecommerce.topClientes.length > 0 ? (
              <div className="space-y-2">
                {ecommerce.topClientes.map((cliente, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{cliente.nomeCliente}</p>
                      <p className="text-xs text-muted-foreground">{cliente.telefoneCliente}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(cliente.totalGasto)}</p>
                      <p className="text-xs text-muted-foreground">{cliente.quantidadeCompras} compras</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum cliente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
