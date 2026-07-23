import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from './store'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type { Pedido } from '@/features/ecommerce/types/ecommerce.types'
import { Camera, ArrowLeft, Loader2, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
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

function StatusIcon({ status }: { status: string }) {
  const className = 'h-5 w-5'
  switch (status) {
    case 'PAGO':
    case 'CONCLUIDO': return <CheckCircle className={`${className} text-emerald-500`} />
    case 'CANCELADO': return <XCircle className={`${className} text-red-500`} />
    default: return <Clock className={`${className} text-amber-500`} />
  }
}

export function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useCustomerAuth()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || !id) return
    ecommerceService.buscarPedido(id)
      .then(setPedido)
      .catch(() => toast.error('Erro ao carregar pedido'))
      .finally(() => setIsLoading(false))
  }, [user, id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg">Pedido não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/minha-conta')}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Camera className="h-5 w-5 text-primary mr-2" />
          <span className="font-semibold text-sm">Photoizer</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/minha-conta')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <StatusIcon status={pedido.status} />
          <div>
            <h1 className="text-xl font-bold">Pedido #{pedido.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">{statusLabel(pedido.status)}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card divide-y">
          <div className="p-4 flex justify-between">
            <span className="text-sm text-muted-foreground">Pacote</span>
            <span className="text-sm font-medium">{formatCurrency(pedido.subtotalPacote)}</span>
          </div>
          {pedido.subtotalExtras > 0 && (
            <div className="p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Extras</span>
              <span className="text-sm font-medium">{formatCurrency(pedido.subtotalExtras)}</span>
            </div>
          )}
          <div className="p-4 flex justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Entrega</span>
            <span className="text-sm font-medium">{formatCurrency(pedido.taxaEntrega)}</span>
          </div>
          {pedido.desconto > 0 && (
            <div className="p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Desconto</span>
              <span className="text-sm font-medium text-emerald-600">-{formatCurrency(pedido.desconto)}</span>
            </div>
          )}
          <div className="p-4 flex justify-between bg-muted/30">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-bold">{formatCurrency(pedido.total)}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-sm text-muted-foreground">Forma de Pagamento</span>
            <span className="text-sm font-medium">{pedido.formaPagamento ?? '—'}</span>
          </div>
          {pedido.dataPedido && (
            <div className="p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Data do Pedido</span>
              <span className="text-sm font-medium">{new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {pedido.dataConclusao && (
            <div className="p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Concluído em</span>
              <span className="text-sm font-medium">{new Date(pedido.dataConclusao).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
