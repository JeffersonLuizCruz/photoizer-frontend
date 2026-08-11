import { Check, Clock } from 'lucide-react'

interface PurchaseConfirmationProps {
  compra: {
    id: string
    valorTotal: number
    metodoPagamento: string | null
    status: string
  }
  token: string
  onVoltar: () => void
}

export function PurchaseConfirmation({ compra, onVoltar }: PurchaseConfirmationProps) {
  const paga = compra.status === 'PAGA'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-md p-8">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center ${paga ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          {paga ? <Check className="h-8 w-8 text-emerald-600" /> : <Clock className="h-8 w-8 text-amber-600" />}
        </div>
        <h1 className="text-xl font-semibold">{paga ? 'Pagamento Confirmado!' : 'Compra Finalizada!'}</h1>
        <p className="text-sm text-muted-foreground">
          {paga
            ? 'Suas fotos extras já estão disponíveis para download.'
            : 'O comprovante foi enviado. Após a confirmação do pagamento, as fotos estarão disponíveis para download.'}
        </p>
        <p className="text-xs text-muted-foreground">
          Valor: <strong>R$ {compra.valorTotal.toFixed(2)}</strong>
          {compra.metodoPagamento && ` · ${compra.metodoPagamento === 'PIX' ? 'PIX' : compra.metodoPagamento === 'TRANSFERENCIA' ? 'Transferência' : 'Dinheiro'}`}
        </p>
        <button onClick={onVoltar}
          className="mt-2 rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          Voltar para Galeria
        </button>
      </div>
    </div>
  )
}
