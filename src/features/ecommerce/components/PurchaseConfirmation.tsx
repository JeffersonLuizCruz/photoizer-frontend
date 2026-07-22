import { Check, Upload, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { CompraExtraResponse } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'

interface PurchaseConfirmationProps {
  compra: CompraExtraResponse
  token: string
  comprovanteEnviado: boolean
  onVoltar: () => void
}

export function PurchaseConfirmation({ compra, token, comprovanteEnviado, onVoltar }: PurchaseConfirmationProps) {
  const [isEnviando, setIsEnviando] = useState(false)
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [enviado, setEnviado] = useState(comprovanteEnviado)

  const enviarComprovante = async () => {
    if (!comprovanteFile) return
    setIsEnviando(true)
    try {
      await ecommerceService.uploadComprovante(token, compra.id, comprovanteFile)
      setEnviado(true)
      toast.success('Comprovante enviado!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar comprovante')
    } finally {
      setIsEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-md p-8">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold">Compra Finalizada!</h1>
        <p className="text-sm text-muted-foreground">
          Sua compra de <strong>R$ {compra.valorTotal.toFixed(2)}</strong> em fotos extras foi registrada.
        </p>
        {compra.metodoPagamento && (
          <p className="text-xs text-muted-foreground">
            Forma de pagamento: <strong>{compra.metodoPagamento === 'PIX' ? 'PIX' : compra.metodoPagamento === 'TRANSFERENCIA' ? 'Transferência' : 'Dinheiro'}</strong>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {enviado
            ? 'O comprovante foi enviado. Após a confirmação do pagamento, as fotos estarão disponíveis para download.'
            : 'Envie o comprovante de pagamento para liberar as fotos.'}
        </p>

        {!enviado && (
          <div className="w-full max-w-xs space-y-2">
            <label className="text-xs font-medium block">Comprovante de Pagamento</label>
            <input type="file" accept="image/*,.pdf" className="text-xs w-full"
              onChange={(e) => setComprovanteFile(e.target.files?.[0] ?? null)} />
            <button onClick={enviarComprovante} disabled={isEnviando || !comprovanteFile}
              className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              {isEnviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isEnviando ? 'Enviando...' : 'Enviar Comprovante'}
            </button>
          </div>
        )}

        {enviado && (
          <button onClick={onVoltar}
            className="mt-2 rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            Voltar para Galeria
          </button>
        )}
      </div>
    </div>
  )
}
