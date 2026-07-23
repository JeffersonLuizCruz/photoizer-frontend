import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from './store'
import { Package, ShoppingBag, Download, Camera, LogOut, ChevronRight, Loader2, Clock, CheckCircle, XCircle, User, Image } from 'lucide-react'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type { Pedido } from '@/features/ecommerce/types/ecommerce.types'
import type { AgendamentoCliente } from './types'
import { CustomerAgendamentoCard } from './CustomerAgendamentoCard'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function statusIcon(status: string) {
  switch (status) {
    case 'PAGO':
    case 'CONCLUIDO': return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'CANCELADO': return <XCircle className="h-4 w-4 text-red-500" />
    default: return <Clock className="h-4 w-4 text-amber-500" />
  }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
    PAGO: 'Pago',
    PROCESSANDO: 'Processando',
    ENVIADO: 'Enviado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
  }
  return labels[status] || status
}

export function CustomerDashboardPage() {
  const { user, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [agendamentos, setAgendamentos] = useState<AgendamentoCliente[]>([])
  const [isLoadingAgendamentos, setIsLoadingAgendamentos] = useState(true)
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(true)

  useEffect(() => {
    if (!user) return
    ecommerceService.listarPedidosCliente(user.id)
      .then(setPedidos)
      .catch(() => {})
      .finally(() => setIsLoadingPedidos(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    ecommerceService.listarAgendamentosCliente()
      .then(setAgendamentos)
      .catch(() => {})
      .finally(() => setIsLoadingAgendamentos(false))
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/acesso-cliente')
  }

  if (!user) {
    navigate('/acesso-cliente')
    return null
  }

  const agendamentosComFotos = agendamentos.filter(a => a.totalFotosPublicadas > 0)
  const agendamentosSemFotos = agendamentos.filter(a => a.totalFotosPublicadas === 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Photoizer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/minha-conta/editar')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-3.5 w-3.5" /> Editar Dados
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Olá, {user.nome}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Bem-vindo à sua área do cliente</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border bg-card p-4">
            <Image className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{agendamentosComFotos.length}</p>
            <p className="text-xs text-muted-foreground">Ensaios com fotos</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <ShoppingBag className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">{pedidos.length}</p>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Download className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{pedidos.filter(p => p.status === 'CONCLUIDO' || p.status === 'PAGO').length}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Clock className="h-5 w-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{pedidos.filter(p => p.status === 'PENDENTE' || p.status === 'AGUARDANDO_PAGAMENTO').length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>

        {/* Seção: Meus Ensaios */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold mb-4">Meus Ensaios</h2>

          {isLoadingAgendamentos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum ensaio encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendamentosComFotos.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {agendamentosComFotos.map((a) => (
                    <CustomerAgendamentoCard key={a.id} agendamento={a} />
                  ))}
                </div>
              )}
              {agendamentosSemFotos.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                    {agendamentosSemFotos.length} ensaio(s) sem fotos publicadas
                  </summary>
                  <div className="mt-3 space-y-2">
                    {agendamentosSemFotos.map((a) => (
                      <div key={a.id} className="rounded-lg border bg-card/50 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">{a.pacoteNome}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(a.dataHoraEnsaio).toLocaleDateString('pt-BR')} · {a.statusDescricao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Seção: Meus Pedidos */}
        <div>
          <h2 className="text-sm font-semibold mb-4">Meus Pedidos</h2>

          {isLoadingPedidos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidos.map((pedido) => (
                <div key={pedido.id}
                  onClick={() => navigate(`/minha-conta/pedidos/${pedido.id}`)}
                  className="rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcon(pedido.status)}
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(pedido.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {statusLabel(pedido.status)}
                          {pedido.dataPedido && ` · ${new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
